"""
Management command untuk sync password changes ke aplikasi eksternal
Compatible dengan ESIMPEG sync_password_to_apps
"""
import os
import time
import json
import hashlib
import hmac
import requests
from io import StringIO
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.integrations.models import WebhookRegistration, PasswordChangeEvent, WebhookLog


class Command(BaseCommand):
    help = 'Sync password changes to registered external apps (webhook pipeline)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--since-minutes',
            type=int,
            default=60,
            help='Sync password changes from last N minutes (default: 60)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Maximum number of events to process (default: 100)'
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Sync specific username only'
        )
        parser.add_argument(
            '--app-name',
            type=str,
            help='Sync to specific app only'
        )
        parser.add_argument(
            '--lock-file',
            type=str,
            default='/tmp/asncorpu_password_sync.lock',
            help='Lock file path'
        )
    
    def handle(self, *args, **options):
        since_minutes = options['since_minutes']
        limit = options['limit']
        username = options['username']
        app_name = options['app_name']
        lock_file = options['lock_file']
        
        # Check lock file (prevent concurrent runs)
        if os.path.exists(lock_file):
            self.stdout.write(
                self.style.WARNING(f'Lock file exists: {lock_file}. Another sync might be running.')
            )
            return
        
        # Create lock file
        try:
            with open(lock_file, 'w') as f:
                f.write(str(os.getpid()))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create lock file: {e}')
            )
            return
        
        try:
            self._sync_passwords(since_minutes, limit, username, app_name)
        finally:
            # Remove lock file
            if os.path.exists(lock_file):
                os.remove(lock_file)
    
    def _sync_passwords(self, since_minutes, limit, username=None, app_name=None):
        """Main sync logic"""
        start_time = time.time()
        
        self.stdout.write('=' * 70)
        self.stdout.write('🔄 Password Sync Pipeline (ASN Corpu → External Apps)')
        self.stdout.write('=' * 70)
        
        # Get unsynced password change events
        since_time = timezone.now() - timedelta(minutes=since_minutes)
        
        events_query = PasswordChangeEvent.objects.filter(
            is_synced=False,
            changed_at__gte=since_time
        )
        
        if username:
            events_query = events_query.filter(username=username)
        
        events = events_query.order_by('changed_at')[:limit]
        
        if not events:
            self.stdout.write(
                self.style.SUCCESS('✅ No password changes to sync')
            )
            return
        
        self.stdout.write(f'📋 Found {len(events)} password change(s) to sync')
        
        # Get active webhook registrations
        registrations_query = WebhookRegistration.objects.filter(
            is_active=True,
            event_type='password_changed'
        )
        
        if app_name:
            registrations_query = registrations_query.filter(app_name=app_name)
        
        registrations = list(registrations_query)
        
        if not registrations:
            self.stdout.write(
                self.style.WARNING('⚠️  No active webhook registrations found')
            )
            return
        
        self.stdout.write(f'🎯 Target apps: {[r.app_name for r in registrations]}')
        
        # Process each event
        total_success = 0
        total_failed = 0
        
        for event in events:
            self.stdout.write(f'\n📤 Processing: {event.username} (changed at {event.changed_at})')
            
            event_success = 0
            event_failed = 0
            
            for registration in registrations:
                success = self._send_webhook(event, registration)
                if success:
                    event_success += 1
                    total_success += 1
                else:
                    event_failed += 1
                    total_failed += 1
            
            # Mark event as synced if at least one webhook succeeded
            if event_success > 0:
                event.is_synced = True
                event.synced_at = timezone.now()
                event.sync_attempts += 1
                event.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Synced to {event_success} app(s)')
                )
            else:
                event.sync_attempts += 1
                event.last_sync_error = f'All {event_failed} webhook(s) failed'
                event.save()
                
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Failed to sync to all {event_failed} app(s)')
                )
        
        # Summary
        duration = time.time() - start_time
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write('📊 Sync Summary')
        self.stdout.write('=' * 70)
        self.stdout.write(f'⏱️  Duration: {duration:.2f} seconds')
        self.stdout.write(f'✅ Success: {total_success}')
        self.stdout.write(f'❌ Failed: {total_failed}')
        self.stdout.write(f'📋 Events processed: {len(events)}')
        self.stdout.write(f'🎯 Target apps: {len(registrations)}')
    
    def _send_webhook(self, event, registration):
        """Send webhook to external app"""
        try:
            # Prepare payload
            payload = {
                'event_type': 'password_changed',
                'username': event.username,
                'password_hash': event.password_hash,
                'changed_at': event.changed_at.isoformat(),
                'changed_by': event.changed_by,
                'source_app': 'asncorpu'
            }
            
            # Create signature
            payload_json = json.dumps(payload, sort_keys=True)
            signature = hmac.new(
                registration.secret_key.encode(),
                payload_json.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Send webhook
            start_time = time.time()
            
            response = requests.post(
                registration.webhook_url,
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': 'password_changed',
                    'User-Agent': 'ASN-Corpu-Webhook/1.0'
                },
                timeout=10  # 10 seconds timeout
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log webhook
            log = WebhookLog.objects.create(
                registration=registration,
                event=event,
                payload=payload,
                status='success' if response.status_code == 200 else 'failed',
                response_code=response.status_code,
                response_body=response.text[:1000],  # Limit response body
                duration_ms=duration_ms
            )
            
            # Update registration stats
            registration.total_sent += 1
            registration.last_sent_at = timezone.now()
            
            if response.status_code == 200:
                registration.total_success += 1
                self.stdout.write(f'    ✅ {registration.app_name}: {response.status_code} ({duration_ms}ms)')
                return True
            else:
                registration.total_failed += 1
                log.error_message = f'HTTP {response.status_code}: {response.text[:500]}'
                log.save()
                self.stdout.write(f'    ❌ {registration.app_name}: {response.status_code} ({duration_ms}ms)')
                return False
            
        except requests.exceptions.Timeout:
            # Timeout
            log = WebhookLog.objects.create(
                registration=registration,
                event=event,
                payload=payload,
                status='timeout',
                error_message='Request timeout (10s)'
            )
            registration.total_sent += 1
            registration.total_failed += 1
            self.stdout.write(f'    ⏰ {registration.app_name}: Timeout')
            return False
            
        except Exception as e:
            # Other errors
            log = WebhookLog.objects.create(
                registration=registration,
                event=event,
                payload=payload,
                status='failed',
                error_message=str(e)[:500]
            )
            registration.total_sent += 1
            registration.total_failed += 1
            self.stdout.write(f'    ❌ {registration.app_name}: {str(e)[:100]}')
            return False
        
        finally:
            registration.save()