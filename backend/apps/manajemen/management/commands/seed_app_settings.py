"""
Seeder for App Settings - Initial data from screenshot
"""

from django.core.management.base import BaseCommand
from apps.manajemen.models import AppSettings


class Command(BaseCommand):
    help = 'Seed initial app settings data'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding App Settings...')

        settings_data = [
            # General Settings
            {
                'key': 'app_name',
                'value': 'BKPSDM Pesisir Selatan',
                'type': 'string',
                'category': 'general',
                'description': 'Application name displayed in header and title',
                'is_public': True,
            },
            {
                'key': 'app_description',
                'value': 'Website Utama Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Pesisir Selatan',
                'type': 'text',
                'category': 'general',
                'description': 'Application description for meta tags',
                'is_public': True,
            },
            {
                'key': 'app_version',
                'value': '3.0.0',
                'type': 'string',
                'category': 'general',
                'description': 'Current application version',
                'is_public': True,
            },
            
            # Contact Information
            {
                'key': 'contact_email',
                'value': 'bkpsdm@pesisirselatankab.go.id',
                'type': 'email',
                'category': 'contact',
                'description': 'Primary contact email',
                'is_public': True,
            },
            {
                'key': 'contact_phone',
                'value': '(0756) 21046',
                'type': 'string',
                'category': 'contact',
                'description': 'Primary contact phone number',
                'is_public': True,
            },
            {
                'key': 'contact_fax',
                'value': '(0756) 21046',
                'type': 'string',
                'category': 'contact',
                'description': 'Fax number',
                'is_public': True,
            },
            {
                'key': 'contact_address',
                'value': 'Jl. Ilyas Yacub Paiman, Kec. IV Jurai, Kab. Pesisir Selatan, Sumatera Barat',
                'type': 'text',
                'category': 'contact',
                'description': 'Office address',
                'is_public': True,
            },
            {
                'key': 'contact_postal_code',
                'value': '25652',
                'type': 'string',
                'category': 'contact',
                'description': 'Postal code',
                'is_public': True,
            },
            {
                'key': 'contact_website',
                'value': 'https://bkpsdm.pesisirselatankab.go.id',
                'type': 'url',
                'category': 'contact',
                'description': 'Official website URL',
                'is_public': True,
            },
            
            # Social Media
            {
                'key': 'social_facebook',
                'value': 'https://www.facebook.com/Bkpsdmpesisirselatan/',
                'type': 'url',
                'category': 'social',
                'description': 'Facebook page URL',
                'is_public': True,
            },
            {
                'key': 'social_instagram',
                'value': 'https://www.instagram.com/bkpsdm_pessel/',
                'type': 'url',
                'category': 'social',
                'description': 'Instagram profile URL',
                'is_public': True,
            },
            {
                'key': 'social_youtube',
                'value': 'https://www.youtube.com/channel/UCt-sAak8oT99YaWULI-MxAw',
                'type': 'url',
                'category': 'social',
                'description': 'YouTube channel URL',
                'is_public': True,
            },
            {
                'key': 'social_twitter',
                'value': '',
                'type': 'url',
                'category': 'social',
                'description': 'Twitter profile URL',
                'is_public': True,
            },
            {
                'key': 'social_tiktok',
                'value': 'https://www.tiktok.com/@bkpsdm.pessel?_t=ZS-8vV0bXcBvQE&_r=1',
                'type': 'url',
                'category': 'social',
                'description': 'TikTok profile URL',
                'is_public': True,
            },
            
            # Appearance
            {
                'key': 'theme_color',
                'value': '',
                'type': 'string',
                'category': 'appearance',
                'description': 'Primary theme color (hex code)',
                'is_public': True,
            },
            {
                'key': 'theme_mode',
                'value': 'system',
                'type': 'string',
                'category': 'appearance',
                'description': 'Theme mode: light, dark, or system',
                'is_public': False,
            },
            {
                'key': 'logo',
                'value': '/uploads/settings/logo-17e2f7335903.png',
                'type': 'file',
                'category': 'appearance',
                'description': 'Main logo file path',
                'is_public': True,
            },
            {
                'key': 'logo_small',
                'value': '/uploads/settings/logo_small-17e2f7342990.png',
                'type': 'file',
                'category': 'appearance',
                'description': 'Small logo file path (for mobile/compact view)',
                'is_public': True,
            },
            {
                'key': 'favicon',
                'value': '/uploads/settings/favicon-17e2477345997.png',
                'type': 'file',
                'category': 'appearance',
                'description': 'Favicon file path',
                'is_public': True,
            },
            
            # Footer
            {
                'key': 'footer_tagline',
                'value': 'Website OPD BKPSDM Kab. Pesisir Selatan',
                'type': 'string',
                'category': 'general',
                'description': 'Footer tagline text',
                'is_public': True,
            },
            {
                'key': 'footer_description',
                'value': 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Pesisir Selatan',
                'type': 'text',
                'category': 'general',
                'description': 'Footer description text',
                'is_public': True,
            },
            {
                'key': 'footer_developer_name',
                'value': 'IT BKPSDM Pesisir Selatan',
                'type': 'string',
                'category': 'general',
                'description': 'Developer name shown in footer',
                'is_public': True,
            },
            {
                'key': 'footer_developer_url',
                'value': 'http://it.bkpsdm.pesisirselatankab.go.id',
                'type': 'url',
                'category': 'general',
                'description': 'Developer website URL',
                'is_public': True,
            },
            
            # Work Hours
            {
                'key': 'work_hours_weekday',
                'value': '',
                'type': 'string',
                'category': 'general',
                'description': 'Work hours on weekdays',
                'is_public': True,
            },
            {
                'key': 'work_hours_friday',
                'value': '',
                'type': 'string',
                'category': 'general',
                'description': 'Work hours on Friday',
                'is_public': True,
            },
            {
                'key': 'work_hours_weekend',
                'value': '',
                'type': 'string',
                'category': 'general',
                'description': 'Work hours on weekend',
                'is_public': True,
            },
        ]

        created = 0
        updated = 0
        skipped = 0

        for data in settings_data:
            key = data['key']
            
            try:
                setting, was_created = AppSettings.objects.get_or_create(
                    key=key,
                    defaults=data
                )
                
                if was_created:
                    created += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✅ Created: {key}'))
                else:
                    # Update existing setting
                    changed = False
                    for field, value in data.items():
                        if field != 'key' and getattr(setting, field) != value:
                            setattr(setting, field, value)
                            changed = True
                    
                    if changed:
                        setting.save()
                        updated += 1
                        self.stdout.write(self.style.WARNING(f'  🔄 Updated: {key}'))
                    else:
                        skipped += 1
                        self.stdout.write(self.style.NOTICE(f'  ⏭️  Skipped: {key} (no changes)'))
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Error creating {key}: {str(e)}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Seeding completed!'))
        self.stdout.write(f'   Created: {created}')
        self.stdout.write(f'   Updated: {updated}')
        self.stdout.write(f'   Skipped: {skipped}')
        self.stdout.write(f'   Total: {len(settings_data)}')
