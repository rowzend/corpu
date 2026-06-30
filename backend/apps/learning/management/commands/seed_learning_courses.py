"""
Seed Sample Learning Courses
Creates sample courses with modules, lessons, and quizzes

Usage:
  python manage.py seed_learning_courses
  python manage.py seed_learning_courses --clear
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.learning.models import (
    Course, Module, Lesson, Quiz, QuizQuestion, QuizChoice,
    QuizAttempt, QuizAnswer, Enrollment, LessonProgress, Certificate
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed sample courses, modules, lessons, and quizzes'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing learning courses')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('\U0001f331 Seeding Sample Learning Courses'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            self.stdout.write('Clearing all learning data...')
            Certificate.objects.all().delete()
            QuizAnswer.objects.all().delete()
            QuizAttempt.objects.all().delete()
            QuizChoice.objects.all().delete()
            QuizQuestion.objects.all().delete()
            Quiz.objects.all().delete()
            LessonProgress.objects.all().delete()
            Lesson.objects.all().delete()
            Module.objects.all().delete()
            Enrollment.objects.filter(course__in=Course.objects.all()).delete()
            Course.objects.all().delete()
            self.stdout.write(self.style.WARNING('  \U0001f5d1\ufe0f  Cleared all learning data'))

        instructor = User.objects.first()
        if not instructor:
            self.stdout.write(self.style.ERROR('\u274c No user found. Create a user first.'))
            return

        self.stdout.write(f'Using instructor: {instructor.username}')

        courses_data = [
            {
                'title': 'Dasar-Dasar Administrasi Perkantoran',
                'slug': 'dasar-administrasi-perkantoran',
                'description': '<p>Kursus ini membahas dasar-dasar administrasi perkantoran yang meliputi '
                               'pengelolaan dokumen, komunikasi kantor, dan tata kelola administrasi yang baik.</p>'
                               '<p>Materi disusun secara sistematis untuk memudahkan pemahaman bagi pegawai '
                               'administrasi di lingkungan pemerintahan.</p>',
                'short_description': 'Pelajari dasar-dasar administrasi perkantoran untuk ASN',
                'level': 'beginner',
                'duration_minutes': 720,
                'status': 'published',
                'is_featured': True,
                'modules': [
                    {
                        'title': 'Pengantar Administrasi Perkantoran',
                        'description': 'Memahami konsep dasar administrasi perkantoran',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Definisi dan Ruang Lingkup Administrasi',
                                'slug': 'definisi-administrasi',
                                'content': '<h3>Pengertian Administrasi</h3><p>Administrasi adalah seluruh proses '
                                           'kerja sama antara dua orang atau lebih dalam mencapai tujuan dengan '
                                           'memanfaatkan sarana dan prasarana tertentu secara efisien dan efektif.</p>'
                                           '<h3>Ruang Lingkup</h3><ul><li>Tata Usaha</li><li>Kearsipan</li>'
                                           '<li>Kepegawaian</li><li>Keuangan</li></ul>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 1,
                            },
                            {
                                'title': 'Fungsi dan Tujuan Administrasi',
                                'slug': 'fungsi-administrasi',
                                'content': '<h3>Fungsi Administrasi</h3><p>Fungsi administrasi meliputi perencanaan, '
                                           'pengorganisasian, pengarahan, dan pengawasan.</p>'
                                           '<h3>Tujuan Administrasi</h3><p>Tujuan administrasi adalah mencapai '
                                           'efektivitas dan efisiensi dalam organisasi.</p>',
                                'content_type': 'article',
                                'duration_minutes': 25,
                                'order_index': 2,
                            },
                            {
                                'title': 'Pengelolaan Dokumen Digital',
                                'slug': 'pengelolaan-dokumen-digital',
                                'content': '<h3>Dokumen Digital</h3><p>Panduan pengelolaan dokumen dalam format '
                                           'digital sesuai standar pemerintahan.</p>'
                                           '<p>Dokumen digital memudahkan akses, pencarian, dan distribusi '
                                           'informasi di lingkungan perkantoran modern.</p>',
                                'content_type': 'article',
                                'duration_minutes': 45,
                                'order_index': 3,
                            },
                            {
                                'title': 'Video: Proses Administrasi Kantor',
                                'slug': 'video-proses-administrasi',
                                'content': '<p>Tonton video berikut untuk memahami alur proses administrasi '
                                           'perkantoran secara menyeluruh.</p>',
                                'content_type': 'video',
                                'video_url': 'https://example.com/video-administrasi.mp4',
                                'duration_minutes': 60,
                                'order_index': 4,
                            },
                            {
                                'title': 'Link: Peraturan Administrasi Terbaru',
                                'slug': 'link-peraturan-administrasi',
                                'content': '<p>Pelajari peraturan terbaru terkait administrasi perkantoran '
                                           'di lingkungan ASN.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/peraturan-administrasi',
                                'duration_minutes': 15,
                                'order_index': 5,
                            },
                        ]
                    },
                    {
                        'title': 'Komunikasi Perkantoran',
                        'description': 'Teknik komunikasi efektif di lingkungan kantor',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'Komunikasi Verbal dan Non-Verbal',
                                'slug': 'komunikasi-verbal',
                                'content': '<h3>Komunikasi Verbal</h3><p>Komunikasi yang menggunakan kata-kata, '
                                           'baik lisan maupun tulisan.</p><h3>Komunikasi Non-Verbal</h3><p>Komunikasi '
                                           'yang menggunakan bahasa tubuh, ekspresi wajah, dan gestur.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 1,
                            },
                            {
                                'title': 'Teknik Presentasi Efektif',
                                'slug': 'teknik-presentasi',
                                'content': '<p>Panduan melakukan presentasi yang efektif di lingkungan kerja.</p>'
                                           '<p>Meliputi persiapan materi, penggunaan alat bantu, dan '
                                           'teknik penyampaian.</p>',
                                'content_type': 'video',
                                'video_url': 'https://example.com/presentasi.mp4',
                                'duration_minutes': 60,
                                'order_index': 2,
                            },
                            {
                                'title': 'Dokumen: Panduan Rapat Dinas',
                                'slug': 'dokumen-panduan-rapat',
                                'content': '<p>Unduh panduan lengkap tata cara rapat dinas di '
                                           'lingkungan pemerintahan.</p>',
                                'content_type': 'document',
                                'file_url': 'https://example.com/panduan-rapat.pdf',
                                'duration_minutes': 10,
                                'order_index': 3,
                            },
                            {
                                'title': 'Link: Modul Komunikasi ASN',
                                'slug': 'link-modul-komunikasi',
                                'content': '<p>Akses modul komunikasi efektif untuk ASN dari LAN RI.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/modul-komunikasi-asn',
                                'duration_minutes': 20,
                                'order_index': 4,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi',
                        'description': 'Evaluasi pemahaman materi kursus',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Akhir Administrasi Perkantoran',
                                'slug': 'kuis-akhir-administrasi',
                                'content': '<p>Kerjakan kuis untuk menguji pemahaman Anda tentang '
                                           'administrasi perkantoran.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 30,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Administrasi Perkantoran',
                                    'description': 'Kuis untuk menguji pemahaman materi administrasi perkantoran',
                                    'passing_score_percentage': 70,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 15,
                                    'questions': [
                                        {
                                            'question_text': 'Apa yang dimaksud dengan administrasi?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Proses kerja sama untuk mencapai tujuan', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Kegiatan mengetik dokumen', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Pengelolaan keuangan kantor', 'is_correct': False, 'order_index': 3},
                                                {'choice_text': 'Kegiatan rapat kantor', 'is_correct': False, 'order_index': 4},
                                            ]
                                        },
                                        {
                                            'question_text': 'Berikut ini termasuk ruang lingkup administrasi, kecuali:',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Tata Usaha', 'is_correct': False, 'order_index': 1},
                                                {'choice_text': 'Kearsipan', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Olahraga', 'is_correct': True, 'order_index': 3},
                                                {'choice_text': 'Kepegawaian', 'is_correct': False, 'order_index': 4},
                                            ]
                                        },
                                        {
                                            'question_text': 'Fungsi administrasi meliputi:',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Perencanaan, pengorganisasian, pengarahan, pengawasan', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Mengetik, mengarsip, menghitung', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Belajar, bekerja, beristirahat', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Dokumen digital harus dikelola sesuai standar pemerintahan.',
                                            'question_type': 'true_false',
                                            'points': 5,
                                            'choices': [
                                                {'choice_text': 'True', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'False', 'is_correct': False, 'order_index': 2},
                                            ]
                                        },
                                        {
                                            'question_text': 'Sebutkan tujuan dari administrasi perkantoran!',
                                            'question_type': 'essay',
                                            'points': 20,
                                            'choices': [],
                                            'essay_word_limit': 150,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
            {
                'title': 'Manajemen Kinerja ASN',
                'slug': 'manajemen-kinerja-asn',
                'description': '<p>Kursus tentang sistem manajemen kinerja Aparatur Sipil Negara (ASN) '
                               'berdasarkan peraturan terbaru.</p>',
                'short_description': 'Pahami sistem manajemen kinerja ASN',
                'level': 'intermediate',
                'duration_minutes': 1200,
                'status': 'published',
                'is_featured': True,
                'modules': [
                    {
                        'title': 'Konsep Manajemen Kinerja',
                        'description': 'Memahami dasar-dasar manajemen kinerja',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Pengertian Manajemen Kinerja',
                                'slug': 'pengertian-manajemen-kinerja',
                                'content': '<h3>Definisi</h3><p>Manajemen kinerja adalah proses berkelanjutan untuk '
                                           'mengidentifikasi, mengukur, mengembangkan, dan menyelaraskan '
                                           'kinerja individu dengan tujuan organisasi.</p>'
                                           '<h3>Tujuan</h3><p>Meningkatkan efektivitas dan efisiensi organisasi '
                                           'melalui pengembangan kompetensi ASN.</p>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 1,
                            },
                            {
                                'title': 'Siklus Manajemen Kinerja',
                                'slug': 'siklus-manajemen-kinerja',
                                'content': '<p>Siklus manajemen kinerja terdiri dari:</p>'
                                           '<ol><li>Perencanaan</li><li>Pemantauan</li>'
                                           '<li>Pengembangan</li><li>Penilaian</li>'
                                           '<li>Penghargaan</li></ol>',
                                'content_type': 'article',
                                'duration_minutes': 40,
                                'order_index': 2,
                            },
                            {
                                'title': 'Video: Sistem Kinerja ASN',
                                'slug': 'video-sistem-kinerja-asn',
                                'content': '<p>Tonton video penjelasan tentang sistem manajemen kinerja ASN '
                                           'berdasarkan PP No. 30 Tahun 2019.</p>',
                                'content_type': 'video',
                                'video_url': 'https://example.com/kinerja-asn.mp4',
                                'duration_minutes': 90,
                                'order_index': 3,
                            },
                            {
                                'title': 'Link: Dasar Hukum Manajemen Kinerja',
                                'slug': 'link-dasar-hukum-kinerja',
                                'content': '<p>Pelajari dasar hukum manajemen kinerja ASN.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/dasar-hukum-kinerja-asn',
                                'duration_minutes': 20,
                                'order_index': 4,
                            },
                        ]
                    },
                    {
                        'title': 'SKP dan Target Kinerja',
                        'description': 'Memahami Sasaran Kinerja Pegawai',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'Penyusunan SKP',
                                'slug': 'penyusunan-skp',
                                'content': '<h3>Sasaran Kinerja Pegawai (SKP)</h3><p>Panduan penyusunan SKP yang '
                                           'sesuai dengan ketentuan perundang-undangan.</p>'
                                           '<p>SKP memuat rencana kerja dan target yang akan dicapai '
                                           'oleh setiap ASN dalam periode tertentu.</p>',
                                'content_type': 'article',
                                'duration_minutes': 45,
                                'order_index': 1,
                            },
                            {
                                'title': 'Dokumen: Contoh Format SKP',
                                'slug': 'dokumen-contoh-skp',
                                'content': '<p>Dokumen contoh format SKP yang dapat diunduh dan digunakan '
                                           'sebagai referensi.</p>',
                                'content_type': 'document',
                                'file_url': 'https://example.com/skp-contoh.pdf',
                                'duration_minutes': 15,
                                'order_index': 2,
                            },
                            {
                                'title': 'Penilaian Prestasi Kerja',
                                'slug': 'penilaian-prestasi-kerja',
                                'content': '<p>Materi tentang sistem penilaian prestasi kerja ASN yang '
                                           'mencakup aspek kinerja dan perilaku kerja.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 3,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi Manajemen Kinerja',
                        'description': 'Uji pemahaman manajemen kinerja',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Manajemen Kinerja',
                                'slug': 'kuis-manajemen-kinerja',
                                'content': '<p>Kerjakan kuis untuk evaluasi pemahaman materi manajemen kinerja.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 30,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Manajemen Kinerja',
                                    'description': 'Uji pemahaman tentang manajemen kinerja ASN',
                                    'passing_score_percentage': 75,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 20,
                                    'questions': [
                                        {
                                            'question_text': 'Apa kepanjangan dari SKP?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Sasaran Kerja Pegawai', 'is_correct': False, 'order_index': 1},
                                                {'choice_text': 'Sasaran Kinerja Pegawai', 'is_correct': True, 'order_index': 2},
                                                {'choice_text': 'Sistem Kinerja Pegawai', 'is_correct': False, 'order_index': 3},
                                                {'choice_text': 'Surat Keputusan Pegawai', 'is_correct': False, 'order_index': 4},
                                            ]
                                        },
                                        {
                                            'question_text': 'SKP disusun oleh setiap ASN pada awal tahun berjalan.',
                                            'question_type': 'true_false',
                                            'points': 5,
                                            'choices': [
                                                {'choice_text': 'True', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'False', 'is_correct': False, 'order_index': 2},
                                            ]
                                        },
                                        {
                                            'question_text': 'Berikut ini yang bukan termasuk siklus manajemen kinerja adalah:',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Perencanaan', 'is_correct': False, 'order_index': 1},
                                                {'choice_text': 'Penilaian', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Liburan', 'is_correct': True, 'order_index': 3},
                                                {'choice_text': 'Pengembangan', 'is_correct': False, 'order_index': 4},
                                            ]
                                        },
                                        {
                                            'question_text': 'Jelaskan pentingnya manajemen kinerja bagi ASN!',
                                            'question_type': 'essay',
                                            'points': 20,
                                            'choices': [],
                                            'essay_word_limit': 200,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
            {
                'title': 'Teknologi Informasi untuk ASN',
                'slug': 'teknologi-informasi-asn',
                'description': '<p>Kursus pengenalan teknologi informasi yang relevan untuk '
                               'mendukung tugas sehari-hari ASN.</p>',
                'short_description': 'Tingkatkan literasi digital sebagai ASN',
                'level': 'beginner',
                'duration_minutes': 960,
                'status': 'published',
                'is_featured': True,
                'modules': [
                    {
                        'title': 'Dasar Teknologi Informasi',
                        'description': 'Pengenalan dasar TI untuk ASN',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Pengenalan Komputer',
                                'slug': 'pengenalan-komputer',
                                'content': '<h3>Komponen Komputer</h3><p>Materi dasar tentang komponen komputer '
                                           'dan fungsinya: hardware, software, dan brainware.</p>'
                                           '<ul><li>CPU sebagai otak komputer</li><li>RAM untuk memori sementara</li>'
                                           '<li>Storage untuk penyimpanan data</li></ul>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 1,
                            },
                            {
                                'title': 'Sistem Operasi dan Aplikasi Perkantoran',
                                'slug': 'sistem-operasi',
                                'content': '<p>Panduan penggunaan sistem operasi Windows dan aplikasi perkantoran '
                                           'seperti Microsoft Office untuk mendukung tugas sehari-hari.</p>',
                                'content_type': 'article',
                                'duration_minutes': 45,
                                'order_index': 2,
                            },
                            {
                                'title': 'Video: Penggunaan Microsoft Word',
                                'slug': 'video-word',
                                'content': '<p>Tutorial penggunaan Microsoft Word untuk pembuatan dokumen '
                                           'administrasi perkantoran.</p>',
                                'content_type': 'video',
                                'video_url': 'https://example.com/tutorial-word.mp4',
                                'duration_minutes': 60,
                                'order_index': 3,
                            },
                            {
                                'title': 'Link: Panduan Literasi Digital',
                                'slug': 'link-literasi-digital',
                                'content': '<p>Akses panduan lengkap literasi digital dari Kominfo.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/literasi-digital',
                                'duration_minutes': 15,
                                'order_index': 4,
                            },
                        ]
                    },
                    {
                        'title': 'Keamanan Informasi',
                        'description': 'Prinsip keamanan informasi di lingkungan kerja',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'Keamanan Informasi Dasar',
                                'slug': 'keamanan-informasi',
                                'content': '<h3>Prinsip Dasar</h3><p>Prinsip dasar keamanan informasi: '
                                           'Confidentiality, Integrity, Availability (CIA).</p>'
                                           '<p>Pentingnya menjaga kerahasiaan data dan informasi '
                                           'di lingkungan pemerintahan.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 1,
                            },
                            {
                                'title': 'Pengelolaan Password',
                                'slug': 'pengelolaan-password',
                                'content': '<p>Tips dan praktik terbaik dalam pengelolaan password '
                                           'untuk keamanan akun digital.</p>',
                                'content_type': 'article',
                                'duration_minutes': 20,
                                'order_index': 2,
                            },
                            {
                                'title': 'Dokumen: SOP Keamanan TI',
                                'slug': 'dokumen-sop-keamanan-ti',
                                'content': '<p>Unduh SOP keamanan teknologi informasi untuk referensi.',
                                'content_type': 'document',
                                'file_url': 'https://example.com/sop-keamanan-ti.pdf',
                                'duration_minutes': 10,
                                'order_index': 3,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi TI',
                        'description': 'Evaluasi pemahaman teknologi informasi',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Teknologi Informasi',
                                'slug': 'kuis-ti',
                                'content': '<p>Kerjakan kuis untuk menguji pemahaman Anda tentang '
                                           'teknologi informasi.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 25,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Teknologi Informasi',
                                    'description': 'Uji pemahaman tentang teknologi informasi untuk ASN',
                                    'passing_score_percentage': 65,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 10,
                                    'questions': [
                                        {
                                            'question_text': 'Apa kepanjangan dari CPU?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Central Processing Unit', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Computer Personal Unit', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Central Program Unit', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Fungsi RAM pada komputer adalah:',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Menyimpan data permanen', 'is_correct': False, 'order_index': 1},
                                                {'choice_text': 'Menyimpan data sementara saat komputer aktif', 'is_correct': True, 'order_index': 2},
                                                {'choice_text': 'Memproses perintah pengguna', 'is_correct': False, 'order_index': 3},
                                                {'choice_text': 'Menampilkan gambar ke monitor', 'is_correct': False, 'order_index': 4},
                                            ]
                                        },
                                        {
                                            'question_text': 'Harddisk berfungsi untuk menyimpan data permanen.',
                                            'question_type': 'true_false',
                                            'points': 5,
                                            'choices': [
                                                {'choice_text': 'True', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'False', 'is_correct': False, 'order_index': 2},
                                            ]
                                        },
                                        {
                                            'question_text': 'Sebutkan 3 prinsip dasar keamanan informasi!',
                                            'question_type': 'essay',
                                            'points': 15,
                                            'choices': [],
                                            'essay_word_limit': 100,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
            {
                'title': 'Pelayanan Publik Prima',
                'slug': 'pelayanan-publik-prima',
                'description': '<p>Kursus untuk meningkatkan kualitas pelayanan publik bagi ASN '
                               'di lingkungan pemerintahan.</p>',
                'short_description': 'Tingkatkan kualitas pelayanan publik',
                'level': 'intermediate',
                'duration_minutes': 900,
                'status': 'published',
                'is_featured': True,
                'modules': [
                    {
                        'title': 'Konsep Pelayanan Publik',
                        'description': 'Dasar-dasar pelayanan publik',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Pengertian dan Prinsip Pelayanan Publik',
                                'slug': 'pengertian-pelayanan-publik',
                                'content': '<h3>Pengertian</h3><p>Pelayanan publik adalah kegiatan dalam rangka '
                                           'pemenuhan kebutuhan pelayanan sesuai peraturan perundang-undangan.</p>'
                                           '<h3>Prinsip</h3><ul><li>Transparan</li><li>Akuntabel</li>'
                                           '<li>Efisien</li><li>Efektif</li></ul>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 1,
                            },
                            {
                                'title': 'Standar Pelayanan Minimal',
                                'slug': 'standar-pelayanan-minimal',
                                'content': '<p>Memahami standar pelayanan minimal (SPM) yang harus dipenuhi '
                                           'oleh penyelenggara pelayanan publik.</p>'
                                           '<p>SPM mencakup jenis pelayanan, mutu pelayanan, dan '
                                           'biaya pelayanan.</p>',
                                'content_type': 'article',
                                'duration_minutes': 40,
                                'order_index': 2,
                            },
                            {
                                'title': 'Video: Pelayanan Prima di Instansi Pemerintah',
                                'slug': 'video-pelayanan-prima',
                                'content': '<p>Tonton video contoh penerapan pelayanan prima di '
                                           'berbagai instansi pemerintah.</p>',
                                'content_type': 'video',
                                'video_url': 'https://example.com/video-pelayanan-prima.mp4',
                                'duration_minutes': 45,
                                'order_index': 3,
                            },
                            {
                                'title': 'Link: Permen PANRB tentang Pelayanan Publik',
                                'slug': 'link-permen-pelayanan-publik',
                                'content': '<p>Baca peraturan terbaru tentang pelayanan publik '
                                           'dari KemenPANRB.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/permen-pelayanan-publik',
                                'duration_minutes': 20,
                                'order_index': 4,
                            },
                        ]
                    },
                    {
                        'title': 'Implementasi Pelayanan Publik',
                        'description': 'Penerapan pelayanan publik di lapangan',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'SOP Pelayanan Publik',
                                'slug': 'sop-pelayanan-publik',
                                'content': '<p>Standar Operasional Prosedur (SOP) dalam pelayanan publik '
                                           'memastikan konsistensi dan kualitas pelayanan.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 1,
                            },
                            {
                                'title': 'Penanganan Keluhan Masyarakat',
                                'slug': 'penanganan-keluhan',
                                'content': '<p>Strategi dan teknik dalam menangani keluhan masyarakat '
                                           'dengan baik dan profesional.</p>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 2,
                            },
                            {
                                'title': 'Dokumen: Contoh SK Pelayanan Publik',
                                'slug': 'dokumen-sk-pelayanan',
                                'content': '<p>Unduh contoh Surat Keputusan tentang standar pelayanan publik '
                                           'di instansi pemerintah.</p>',
                                'content_type': 'document',
                                'file_url': 'https://example.com/sk-pelayanan-publik.pdf',
                                'duration_minutes': 10,
                                'order_index': 3,
                            },
                            {
                                'title': 'Link: Portal Layanan Aspirasi',
                                'slug': 'link-lapor',
                                'content': '<p>Akses portal LAPOR! untuk pelaporan dan aspirasi masyarakat.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/lapor',
                                'duration_minutes': 15,
                                'order_index': 4,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi Pelayanan Publik',
                        'description': 'Uji pemahaman pelayanan publik',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Pelayanan Publik',
                                'slug': 'kuis-pelayanan-publik',
                                'content': '<p>Evaluasi pemahaman tentang pelayanan publik.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 25,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Pelayanan Publik',
                                    'description': 'Uji pemahaman materi pelayanan publik',
                                    'passing_score_percentage': 65,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 10,
                                    'questions': [
                                        {
                                            'question_text': 'Apa yang dimaksud dengan pelayanan publik?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Kegiatan melayani kebutuhan masyarakat', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Kegiatan administrasi internal', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Kegiatan pengawasan pegawai', 'is_correct': False, 'order_index': 3},
                                                {'choice_text': 'Kegiatan rapat koordinasi', 'is_correct': False, 'order_index': 4},
                                            ]
                                        },
                                        {
                                            'question_text': 'Standar Pelayanan Minimal (SPM) mencakup:',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Jenis, mutu, dan biaya pelayanan', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Hanya jenis pelayanan', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Hanya biaya pelayanan', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Pelayanan publik harus transparan dan akuntabel.',
                                            'question_type': 'true_false',
                                            'points': 5,
                                            'choices': [
                                                {'choice_text': 'True', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'False', 'is_correct': False, 'order_index': 2},
                                            ]
                                        },
                                        {
                                            'question_text': 'Sebutkan prinsip-prinsip pelayanan publik!',
                                            'question_type': 'essay',
                                            'points': 20,
                                            'choices': [],
                                            'essay_word_limit': 150,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
            {
                'title': 'Pengelolaan Arsip Digital',
                'slug': 'pengelolaan-arsip-digital',
                'description': '<p>Kursus tentang pengelolaan arsip digital sesuai standar kearsipan '
                               'nasional untuk ASN.</p>',
                'short_description': 'Kelola arsip digital dengan baik dan benar',
                'level': 'advanced',
                'duration_minutes': 600,
                'status': 'published',
                'is_featured': False,
                'modules': [
                    {
                        'title': 'Dasar Kearsipan Digital',
                        'description': 'Memahami konsep arsip digital',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Pengertian Arsip Digital',
                                'slug': 'pengertian-arsip-digital',
                                'content': '<h3>Definisi</h3><p>Arsip digital adalah arsip yang diciptakan '
                                           'dan disimpan dalam format digital.</p>'
                                           '<h3>Jenis Arsip Digital</h3><ul><li>Dokumen teks</li>'
                                           '<li>Gambar/foto</li><li>Video</li><li>Audio</li></ul>',
                                'content_type': 'article',
                                'duration_minutes': 25,
                                'order_index': 1,
                            },
                            {
                                'title': 'Sistem Kearsipan Digital',
                                'slug': 'sistem-kearsipan-digital',
                                'content': '<p>Pengenalan sistem informasi kearsipan digital yang '
                                           'digunakan di lingkungan pemerintahan.</p>'
                                           '<p>Sistem kearsipan digital mencakup penciptaan, penggunaan, '
                                           'pemeliharaan, dan penyusutan arsip.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 2,
                            },
                            {
                                'title': 'Link: Jaringan Informasi Kearsipan Nasional',
                                'slug': 'link-jikn',
                                'content': '<p>Akses Jaringan Informasi Kearsipan Nasional (JIKN) '
                                           'untuk informasi kearsipan terbaru.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/jikn',
                                'duration_minutes': 15,
                                'order_index': 3,
                            },
                        ]
                    },
                    {
                        'title': 'Tata Kelola Arsip Digital',
                        'description': 'Pengelolaan arsip digital yang baik',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'Prosedur Pengarsipan Digital',
                                'slug': 'prosedur-pengarsipan-digital',
                                'content': '<p>Langkah-langkah dalam pengarsipan dokumen digital '
                                           'sesuai standar yang berlaku.</p>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 1,
                            },
                            {
                                'title': 'Dokumen: Pedoman Kearsipan Digital',
                                'slug': 'dokumen-pedoman-kearsipan',
                                'content': '<p>Unduh pedoman lengkap kearsipan digital dari ANRI.</p>',
                                'content_type': 'document',
                                'file_url': 'https://example.com/pedoman-kearsipan.pdf',
                                'duration_minutes': 10,
                                'order_index': 2,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi Kearsipan',
                        'description': 'Uji pemahaman kearsipan digital',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Kearsipan Digital',
                                'slug': 'kuis-kearsipan-digital',
                                'content': '<p>Kerjakan kuis untuk evaluasi pemahaman kearsipan digital.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 20,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Kearsipan Digital',
                                    'description': 'Uji pemahaman tentang pengelolaan arsip digital',
                                    'passing_score_percentage': 70,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 15,
                                    'questions': [
                                        {
                                            'question_text': 'Apa yang dimaksud dengan arsip digital?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Arsip yang diciptakan dalam format digital', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Arsip yang dicetak di kertas', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Arsip yang difoto', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'JIKN merupakan singkatan dari:',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Jaringan Informasi Kearsipan Nasional', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Jaringan Informasi Keuangan Negara', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Jurnal Ilmiah Kearsipan Nasional', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Sebutkan jenis-jenis arsip digital!',
                                            'question_type': 'essay',
                                            'points': 15,
                                            'choices': [],
                                            'essay_word_limit': 100,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
            {
                'title': 'Integritas dan Anti Korupsi',
                'slug': 'integritas-anti-korupsi',
                'description': '<p>Kursus tentang penguatan integritas dan pencegahan korupsi '
                               'bagi ASN di lingkungan pemerintahan.</p>',
                'short_description': 'Perkuat integritas sebagai ASN',
                'level': 'intermediate',
                'duration_minutes': 1080,
                'status': 'published',
                'is_featured': True,
                'modules': [
                    {
                        'title': 'Konsep Integritas ASN',
                        'description': 'Memahami integritas dalam tugas ASN',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Pengertian Integritas',
                                'slug': 'pengertian-integritas',
                                'content': '<h3>Definisi</h3><p>Integritas adalah konsistensi antara '
                                           'nilai, prinsip, dan tindakan seseorang.</p>'
                                           '<h3>Integritas ASN</h3><p>ASN harus memiliki integritas tinggi '
                                           'dalam menjalankan tugas dan pelayanan kepada masyarakat.</p>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 1,
                            },
                            {
                                'title': 'Kode Etik ASN',
                                'slug': 'kode-etik-asn',
                                'content': '<p>Memahami kode etik dan perilaku ASN berdasarkan '
                                           'peraturan yang berlaku.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 2,
                            },
                            {
                                'title': 'Video: Pentingnya Integritas',
                                'slug': 'video-integritas',
                                'content': '<p>Tonton video tentang pentingnya integritas dalam '
                                           'pelayanan publik.</p>',
                                'content_type': 'video',
                                'video_url': 'https://example.com/video-integritas.mp4',
                                'duration_minutes': 50,
                                'order_index': 3,
                            },
                        ]
                    },
                    {
                        'title': 'Pencegahan Korupsi',
                        'description': 'Memahami bentuk dan pencegahan korupsi',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'Bentuk-Bentuk Korupsi',
                                'slug': 'bentuk-korupsi',
                                'content': '<p>Mengenal berbagai bentuk tindak pidana korupsi: '
                                           'suap, gratifikasi, pemerasan, penggelapan, dan '
                                           'perbuatan curang.</p>',
                                'content_type': 'article',
                                'duration_minutes': 40,
                                'order_index': 1,
                            },
                            {
                                'title': 'Strategi Pencegahan Korupsi',
                                'slug': 'strategi-pencegahan-korupsi',
                                'content': '<p>Strategi pencegahan korupsi meliputi: '
                                           'sistem pengendalian internal, transparansi, '
                                           'whistleblowing system, dan penguatan pengawasan.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 2,
                            },
                            {
                                'title': 'Link: Portal KPK',
                                'slug': 'link-kpk',
                                'content': '<p>Akses portal resmi KPK untuk informasi '
                                           'pencegahan korupsi dan pendidikan anti korupsi.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/kpk',
                                'duration_minutes': 15,
                                'order_index': 3,
                            },
                            {
                                'title': 'Dokumen: Panduan Anti Korupsi',
                                'slug': 'dokumen-panduan-anti-korupsi',
                                'content': '<p>Unduh buku saku panduan anti korupsi untuk ASN.</p>',
                                'content_type': 'document',
                                'file_url': 'https://example.com/panduan-anti-korupsi.pdf',
                                'duration_minutes': 10,
                                'order_index': 4,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi Integritas',
                        'description': 'Uji pemahaman integritas dan anti korupsi',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Integritas',
                                'slug': 'kuis-integritas',
                                'content': '<p>Kerjakan kuis untuk menguji pemahaman tentang '
                                           'integritas dan anti korupsi.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 25,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Integritas & Anti Korupsi',
                                    'description': 'Uji pemahaman tentang integritas dan pencegahan korupsi',
                                    'passing_score_percentage': 70,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 15,
                                    'questions': [
                                        {
                                            'question_text': 'Apa yang dimaksud dengan integritas?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Konsistensi antara nilai dan tindakan', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Kepatuhan pada atasan', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Kecepatan bekerja', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Gratifikasi termasuk bentuk korupsi.',
                                            'question_type': 'true_false',
                                            'points': 5,
                                            'choices': [
                                                {'choice_text': 'True', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'False', 'is_correct': False, 'order_index': 2},
                                            ]
                                        },
                                        {
                                            'question_text': 'Berikut ini yang bukan merupakan strategi pencegahan korupsi:',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Transparansi', 'is_correct': False, 'order_index': 1},
                                                {'choice_text': 'Whistleblowing system', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Menutup akses informasi', 'is_correct': True, 'order_index': 3},
                                                {'choice_text': 'Penguatan pengawasan', 'is_correct': False, 'order_index': 4},
                                            ]
                                        },
                                        {
                                            'question_text': 'Jelaskan pentingnya integritas bagi ASN dalam pelayanan publik!',
                                            'question_type': 'essay',
                                            'points': 20,
                                            'choices': [],
                                            'essay_word_limit': 200,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
            {
                'title': 'Perencanaan Pembangunan Daerah',
                'slug': 'perencanaan-pembangunan-daerah',
                'description': '<p>Kursus tentang perencanaan pembangunan daerah yang efektif '
                               'dan sesuai dengan regulasi terbaru.</p>',
                'short_description': 'Perencanaan pembangunan daerah yang efektif',
                'level': 'intermediate',
                'duration_minutes': 840,
                'status': 'published',
                'is_featured': False,
                'modules': [
                    {
                        'title': 'Dasar Perencanaan Pembangunan',
                        'description': 'Konsep dasar perencanaan pembangunan',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Pengertian Perencanaan Pembangunan',
                                'slug': 'pengertian-perencanaan-pembangunan',
                                'content': '<h3>Definisi</h3><p>Perencanaan pembangunan adalah proses '
                                           'penentuan tujuan dan sasaran pembangunan daerah serta '
                                           'cara mencapainya.</p>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 1,
                            },
                            {
                                'title': 'Sistem Perencanaan Pembangunan Nasional',
                                'slug': 'sistem-perencanaan-nasional',
                                'content': '<p>Memahami sistem perencanaan pembangunan nasional '
                                           'dan daerah sesuai UU No. 25 Tahun 2004.</p>',
                                'content_type': 'article',
                                'duration_minutes': 40,
                                'order_index': 2,
                            },
                            {
                                'title': 'Link: Bappenas',
                                'slug': 'link-bappenas',
                                'content': '<p>Akses portal resmi Bappenas untuk dokumen perencanaan '
                                           'pembangunan nasional.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/bappenas',
                                'duration_minutes': 15,
                                'order_index': 3,
                            },
                        ]
                    },
                    {
                        'title': 'Dokumen Perencanaan Daerah',
                        'description': 'Memahami dokumen perencanaan daerah',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'RPJMD dan RKPD',
                                'slug': 'rpjmd-rkpd',
                                'content': '<p>Rencana Pembangunan Jangka Menengah Daerah (RPJMD) dan '
                                           'Rencana Kerja Pemerintah Daerah (RKPD) adalah dokumen '
                                           'utama perencanaan pembangunan daerah.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 1,
                            },
                            {
                                'title': 'Musrenbang',
                                'slug': 'musrenbang',
                                'content': '<p>Musyawarah Perencanaan Pembangunan (Musrenbang) adalah '
                                           'forum partisipatif dalam perencanaan pembangunan daerah.</p>',
                                'content_type': 'article',
                                'duration_minutes': 25,
                                'order_index': 2,
                            },
                            {
                                'title': 'Dokumen: Contoh RPJMD',
                                'slug': 'dokumen-contoh-rpjmd',
                                'content': '<p>Unduh contoh dokumen RPJMD sebagai referensi.',
                                'content_type': 'document',
                                'file_url': 'https://example.com/contoh-rpjmd.pdf',
                                'duration_minutes': 10,
                                'order_index': 3,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi Perencanaan',
                        'description': 'Uji pemahaman perencanaan pembangunan',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Perencanaan Pembangunan',
                                'slug': 'kuis-perencanaan-pembangunan',
                                'content': '<p>Kerjakan kuis untuk evaluasi pemahaman perencanaan '
                                           'pembangunan daerah.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 20,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Perencanaan Pembangunan Daerah',
                                    'description': 'Uji pemahaman tentang perencanaan pembangunan daerah',
                                    'passing_score_percentage': 65,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 10,
                                    'questions': [
                                        {
                                            'question_text': 'Apa kepanjangan dari RPJMD?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Rencana Pembangunan Jangka Menengah Daerah', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Rencana Program Jangka Menengah Daerah', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Rencana Pembangunan Jangka Panjang Daerah', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Musrenbang adalah forum perencanaan yang bersifat partisipatif.',
                                            'question_type': 'true_false',
                                            'points': 5,
                                            'choices': [
                                                {'choice_text': 'True', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'False', 'is_correct': False, 'order_index': 2},
                                            ]
                                        },
                                        {
                                            'question_text': 'Jelaskan peran Musrenbang dalam perencanaan pembangunan daerah!',
                                            'question_type': 'essay',
                                            'points': 15,
                                            'choices': [],
                                            'essay_word_limit': 150,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
            {
                'title': 'Penganggaran dan Keuangan Daerah',
                'slug': 'penganggaran-keuangan-daerah',
                'description': '<p>Kursus tentang pengelolaan keuangan dan penganggaran daerah '
                               'berdasarkan prinsip good governance.</p>',
                'short_description': 'Pengelolaan keuangan daerah yang akuntabel',
                'level': 'advanced',
                'duration_minutes': 1320,
                'status': 'published',
                'is_featured': False,
                'modules': [
                    {
                        'title': 'Dasar Penganggaran Daerah',
                        'description': 'Konsep dasar penganggaran daerah',
                        'order_index': 1,
                        'lessons': [
                            {
                                'title': 'Siklus Anggaran Daerah',
                                'slug': 'siklus-anggaran-daerah',
                                'content': '<h3>Siklus APBD</h3><p>Siklus anggaran daerah meliputi: '
                                           'perencanaan, pengesahan, pelaksanaan, '
                                           'dan pertanggungjawaban.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 1,
                            },
                            {
                                'title': 'Struktur APBD',
                                'slug': 'struktur-apbd',
                                'content': '<p>Memahami struktur Anggaran Pendapatan dan Belanja Daerah '
                                           '(APBD) yang terdiri dari pendapatan, belanja, dan pembiayaan.</p>',
                                'content_type': 'article',
                                'duration_minutes': 40,
                                'order_index': 2,
                            },
                            {
                                'title': 'Video: Proses Penyusunan APBD',
                                'slug': 'video-penyusunan-apbd',
                                'content': '<p>Tonton video tentang proses penyusunan APBD '
                                           'di pemerintah daerah.</p>',
                                'content_type': 'video',
                                'video_url': 'https://example.com/video-apbd.mp4',
                                'duration_minutes': 60,
                                'order_index': 3,
                            },
                            {
                                'title': 'Link: Permendagri tentang Keuangan Daerah',
                                'slug': 'link-permendagri-keuangan',
                                'content': '<p>Pelajari peraturan terbaru tentang pengelolaan keuangan daerah.</p>',
                                'content_type': 'link',
                                'external_url': 'https://example.com/permendagri-keuangan',
                                'duration_minutes': 20,
                                'order_index': 4,
                            },
                        ]
                    },
                    {
                        'title': 'Akuntabilitas Keuangan',
                        'description': 'Prinsip akuntabilitas keuangan daerah',
                        'order_index': 2,
                        'lessons': [
                            {
                                'title': 'Laporan Keuangan Daerah',
                                'slug': 'laporan-keuangan-daerah',
                                'content': '<p>Pemahaman tentang laporan keuangan daerah: '
                                           'LRA, neraca, laporan arus kas, dan CaLK.</p>',
                                'content_type': 'article',
                                'duration_minutes': 35,
                                'order_index': 1,
                            },
                            {
                                'title': 'Audit Keuangan Daerah',
                                'slug': 'audit-keuangan-daerah',
                                'content': '<p>Proses audit keuangan daerah oleh BPK dan '
                                           'tindak lanjut hasil audit.</p>',
                                'content_type': 'article',
                                'duration_minutes': 30,
                                'order_index': 2,
                            },
                            {
                                'title': 'Dokumen: Contoh APBD',
                                'slug': 'dokumen-contoh-apbd',
                                'content': '<p>Unduh contoh dokumen APBD sebagai referensi '
                                           'pembelajaran.</p>',
                                'content_type': 'document',
                                'file_url': 'https://example.com/contoh-apbd.pdf',
                                'duration_minutes': 10,
                                'order_index': 3,
                            },
                        ]
                    },
                    {
                        'title': 'Evaluasi Keuangan Daerah',
                        'description': 'Uji pemahaman penganggaran daerah',
                        'order_index': 3,
                        'lessons': [
                            {
                                'title': 'Kuis Keuangan Daerah',
                                'slug': 'kuis-keuangan-daerah',
                                'content': '<p>Kerjakan kuis untuk evaluasi pemahaman penganggaran '
                                           'dan keuangan daerah.</p>',
                                'content_type': 'quiz',
                                'duration_minutes': 30,
                                'order_index': 1,
                                'quiz': {
                                    'title': 'Evaluasi Penganggaran & Keuangan Daerah',
                                    'description': 'Uji pemahaman tentang penganggaran daerah',
                                    'passing_score_percentage': 70,
                                    'max_attempts': 1,
                                    'time_limit_minutes': 15,
                                    'questions': [
                                        {
                                            'question_text': 'Apa kepanjangan dari APBD?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Anggaran Pendapatan dan Belanja Daerah', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Anggaran Pembangunan dan Belanja Daerah', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Anggaran Pendapatan dan Biaya Daerah', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Siklus anggaran daerah terdiri dari perencanaan, pengesahan, pelaksanaan, dan pertanggungjawaban.',
                                            'question_type': 'true_false',
                                            'points': 5,
                                            'choices': [
                                                {'choice_text': 'True', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'False', 'is_correct': False, 'order_index': 2},
                                            ]
                                        },
                                        {
                                            'question_text': 'Apa saja komponen utama dalam struktur APBD?',
                                            'question_type': 'multiple_choice',
                                            'points': 10,
                                            'choices': [
                                                {'choice_text': 'Pendapatan, Belanja, Pembiayaan', 'is_correct': True, 'order_index': 1},
                                                {'choice_text': 'Pemasukan, Pengeluaran, Tabungan', 'is_correct': False, 'order_index': 2},
                                                {'choice_text': 'Penerimaan, Pengeluaran, Pinjaman', 'is_correct': False, 'order_index': 3},
                                            ]
                                        },
                                        {
                                            'question_text': 'Jelaskan pentingnya akuntabilitas dalam pengelolaan keuangan daerah!',
                                            'question_type': 'essay',
                                            'points': 20,
                                            'choices': [],
                                            'essay_word_limit': 200,
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                ]
            },
        ]

        courses_created = 0
        courses_updated = 0

        for course_data in courses_data:
            course, created = Course.objects.update_or_create(
                slug=course_data['slug'],
                defaults={
                    'title': course_data['title'],
                    'description': course_data['description'],
                    'short_description': course_data['short_description'],
                    'level': course_data['level'],
                    'duration_minutes': course_data['duration_minutes'],
                    'status': course_data['status'],
                    'is_featured': course_data['is_featured'],
                    'instructor': instructor,
                    'published_at': timezone.now() if course_data['status'] == 'published' else None,
                }
            )
            if created:
                courses_created += 1
                self.stdout.write(f'  \u2705 Created course: {course.title}')
            else:
                courses_updated += 1
                self.stdout.write(f'  \u267b\ufe0f  Updated course: {course.title}')

            for module_data in course_data['modules']:
                mod, mod_created = Module.objects.update_or_create(
                    course=course,
                    order_index=module_data['order_index'],
                    defaults={
                        'title': module_data['title'],
                        'description': module_data['description'],
                    }
                )
                if mod_created:
                    self.stdout.write(f'    \u2705 Created module: {mod.title}')

                for lesson_data in module_data['lessons']:
                    lesson, lesson_created = Lesson.objects.update_or_create(
                        module=mod,
                        slug=lesson_data['slug'],
                        defaults={
                            'title': lesson_data['title'],
                            'content': lesson_data.get('content', ''),
                            'content_type': lesson_data.get('content_type', 'article'),
                            'video_url': lesson_data.get('video_url'),
                            'file_url': lesson_data.get('file_url'),
                            'external_url': lesson_data.get('external_url'),
                            'duration_minutes': lesson_data.get('duration_minutes', 15),
                            'order_index': lesson_data['order_index'],
                        }
                    )
                    if lesson_created:
                        self.stdout.write(f'      \u2705 Created lesson: {lesson.title}')

                    quiz_data = lesson_data.get('quiz')
                    if quiz_data:
                        quiz, quiz_created = Quiz.objects.update_or_create(
                            lesson=lesson,
                            defaults={
                                'title': quiz_data['title'],
                                'description': quiz_data.get('description', ''),
                                'passing_score_percentage': quiz_data['passing_score_percentage'],
                                'max_attempts': quiz_data.get('max_attempts', 1),
                                'time_limit_minutes': quiz_data.get('time_limit_minutes', 0),
                            }
                        )
                        if quiz_created:
                            self.stdout.write(f'        \u2705 Created quiz: {quiz.title}')

                        for q_idx, q_data in enumerate(quiz_data['questions']):
                            question, _ = QuizQuestion.objects.update_or_create(
                                quiz=quiz,
                                question_text=q_data['question_text'],
                                defaults={
                                    'question_type': q_data['question_type'],
                                    'points': q_data['points'],
                                    'order_index': q_idx + 1,
                                    'essay_word_limit': q_data.get('essay_word_limit'),
                                }
                            )

                            for c_data in q_data['choices']:
                                QuizChoice.objects.update_or_create(
                                    question=question,
                                    choice_text=c_data['choice_text'],
                                    defaults={
                                        'is_correct': c_data['is_correct'],
                                        'order_index': c_data.get('order_index', 1),
                                    }
                                )

                            quiz.update_total_questions()

                course.update_lesson_count()

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('\u2705 Learning courses seeded successfully!'))
        self.stdout.write(f'Courses: {courses_created} created, {courses_updated} updated')
        self.stdout.write('')
        self.stdout.write('Next steps:')
        self.stdout.write('  1. Run: python manage.py seed_learning_permissions')
        self.stdout.write('  2. Run: python manage.py seed_superadmin_full_access')
        self.stdout.write('')
