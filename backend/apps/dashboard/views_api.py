from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import Group
from django.db.models import Count, Q
from apps.accounts.models import User
from apps.learning.models import Course, Enrollment, Certificate
from apps.hcdp.models import HcdpProgram
from apps.news.models import News
from core.models import Notification


class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        # Total users (all registered system users)
        total_users = User.objects.count()

        # Active users excluding admin/superadmin roles
        admin_groups = Group.objects.filter(
            Q(name__icontains='superadmin') | Q(name__icontains='admin')
        )
        active_users = User.objects.exclude(groups__in=admin_groups).count()

        # Learning stats
        total_courses = Course.objects.filter(status='published').count()
        total_enrollments = Enrollment.objects.count()
        completed_enrollments = Enrollment.objects.filter(status='completed').count()
        certificates_issued = Certificate.objects.count()

        # HCDP stats
        total_hcdp = HcdpProgram.objects.count()
        active_hcdp = HcdpProgram.objects.filter(status__in=['upcoming', 'ongoing']).count()

        # News stats
        total_berita = News.objects.filter(status='published').count()

        # New users this month
        first_of_month = today.replace(day=1)
        new_users_this_month = User.objects.filter(date_joined__gte=first_of_month).count()

        # Active enrollments (in progress)
        active_enrollments = Enrollment.objects.filter(status='active').count()

        stats = {
            'total_pegawai': 0,
            'pegawai_aktif': active_users,
            'total_users': total_users,
            'total_courses': total_courses,
            'total_enrollments': total_enrollments,
            'completed_enrollments': completed_enrollments,
            'active_enrollments': active_enrollments,
            'certificates_issued': certificates_issued,
            'total_hcdp': total_hcdp,
            'active_hcdp': active_hcdp,
            'total_berita': total_berita,
            'new_users_this_month': new_users_this_month,
        }

        return Response({
            'success': True,
            'data': stats,
            'timestamp': timezone.now().isoformat()
        })


class RecentActivitiesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))

        # Gather recent notifications and certificate issuances
        recent_notifications = Notification.objects.filter(
            user=request.user
        ).order_by('-created_at')[:limit]

        recent_certificates = Certificate.objects.select_related(
            'enrollment__user', 'enrollment__course'
        ).order_by('-issued_at')[:limit]

        recent_enrollments = Enrollment.objects.select_related(
            'user', 'course'
        ).order_by('-enrolled_at')[:limit]

        activities = []

        for notif in recent_notifications:
            activities.append({
                'id': f'notif_{notif.id}',
                'title': notif.title,
                'description': notif.message or '',
                'icon': 'bell',
                'type': 'info',
                'created_at': notif.created_at.isoformat(),
            })

        for cert in recent_certificates:
            activities.append({
                'id': f'cert_{cert.id}',
                'title': f'Sertifikat diterbitkan',
                'description': f'{cert.enrollment.user.name} menyelesaikan {cert.enrollment.course.title}',
                'icon': 'award',
                'type': 'success',
                'created_at': cert.issued_at.isoformat(),
            })

        for enroll in recent_enrollments:
            activities.append({
                'id': f'enroll_{enroll.id}',
                'title': 'Enrollment baru',
                'description': f'{enroll.user.name} mendaftar {enroll.course.title}',
                'icon': 'user-plus',
                'type': 'primary',
                'created_at': enroll.enrolled_at.isoformat(),
            })

        activities.sort(key=lambda a: a['created_at'], reverse=True)
        activities = activities[:limit]

        return Response({
            'success': True,
            'data': activities,
            'total': len(activities),
            'timestamp': timezone.now().isoformat()
        })


class SystemStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        database_status = self._check_database()
        cache_status = self._check_cache()
        siasn_status = self._check_siasn()

        system_status = {
            'database': database_status,
            'cache': cache_status,
            'siasn': siasn_status,
            'overall': 'healthy' if all([
                database_status['status'] == 'online',
                cache_status['status'] == 'online'
            ]) else 'degraded'
        }

        return Response({
            'success': True,
            'data': system_status,
            'timestamp': timezone.now().isoformat()
        })

    def _check_database(self):
        try:
            from django.db import connection
            connection.ensure_connection()
            return {'status': 'online', 'message': 'Database connected', 'icon': 'check-circle', 'class': 'success'}
        except Exception as e:
            return {'status': 'offline', 'message': f'Database error: {str(e)}', 'icon': 'times-circle', 'class': 'danger'}

    def _check_cache(self):
        try:
            from django.core.cache import cache
            cache.set('health_check', 'ok', 10)
            result = cache.get('health_check')
            if result == 'ok':
                return {'status': 'online', 'message': 'Cache active', 'icon': 'check-circle', 'class': 'success'}
            else:
                return {'status': 'offline', 'message': 'Cache not responding', 'icon': 'times-circle', 'class': 'danger'}
        except Exception as e:
            return {'status': 'offline', 'message': f'Cache error: {str(e)}', 'icon': 'times-circle', 'class': 'danger'}

    def _check_siasn(self):
        return {'status': 'disconnected', 'message': 'SIASN API not configured', 'icon': 'exclamation-triangle', 'class': 'warning'}


class DashboardChartsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        # Real enrollment trend (last 6 months)
        months = []
        labels = []
        datasets = {
            'PNS': [],
            'PPPK': [],
        }
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
            if i == 0:
                month_end = today
            else:
                next_month = month_start.replace(day=28) + timedelta(days=4)
                month_end = next_month - timedelta(days=next_month.day)
            month_name = month_start.strftime('%b')
            labels.append(month_name)
            months.append((month_start, month_end))

            enroll_count = Enrollment.objects.filter(
                enrolled_at__gte=month_start,
                enrolled_at__lte=month_end
            ).count()

            cert_count = Certificate.objects.filter(
                issued_at__gte=month_start,
                issued_at__lte=month_end
            ).count()

            datasets.setdefault('Enrollments', []).append(enroll_count)
            datasets.setdefault('Certificates', []).append(cert_count)

        monthly_trend = {
            'labels': labels,
            'datasets': [
                {'label': 'Enrollments', 'data': datasets.get('Enrollments', []), 'color': '#3B82F6'},
                {'label': 'Certificates', 'data': datasets.get('Certificates', []), 'color': '#10B981'},
            ]
        }

        # Course level distribution
        level_counts = Course.objects.values('level').annotate(count=Count('id'))
        level_labels = {'beginner': 'Pemula', 'intermediate': 'Menengah', 'advanced': 'Lanjutan'}
        dist_labels = []
        dist_values = []
        dist_colors = ['#3B82F6', '#10B981', '#F59E0B']
        for item in level_counts:
            label = level_labels.get(item['level'], item['level'])
            dist_labels.append(label)
            dist_values.append(item['count'])

        golongan_data = {
            'labels': dist_labels or ['Belum ada data'],
            'values': dist_values or [1],
            'colors': dist_colors[:len(dist_labels)] or ['#E5E7EB'],
        }

        charts = {
            'golongan_distribution': golongan_data,
            'monthly_trend': monthly_trend,
        }

        return Response({
            'success': True,
            'data': charts,
            'timestamp': timezone.now().isoformat()
        })
