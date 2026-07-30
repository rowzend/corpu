from django import forms
from .models import MsPerguruanTinggi, MsProgramStudi


STATUS_CHOICES = ((1, 'Aktif'), (0, 'Non Aktif'))


class MsPerguruanTinggiForm(forms.ModelForm):
    status = forms.TypedChoiceField(
        choices=STATUS_CHOICES, coerce=int, required=True,
        widget=forms.Select(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
    )

    class Meta:
        model = MsPerguruanTinggi
        fields = [
            'kode_pt', 'nama_pt', 'bentuk_pt', 'status_pt',
            'alamat', 'kota', 'provinsi', 'telepon', 'website', 'email',
            'akreditasi', 'is_active',
        ]
        labels = {
            'kode_pt': 'Kode PT',
            'nama_pt': 'Nama Perguruan Tinggi',
            'bentuk_pt': 'Bentuk PT',
            'status_pt': 'Status',
            'alamat': 'Alamat',
            'kota': 'Kota',
            'provinsi': 'Provinsi',
            'telepon': 'Telepon',
            'website': 'Website',
            'email': 'Email',
            'akreditasi': 'Akreditasi',
            'is_active': 'Aktif',
        }
        widgets = {
            'kode_pt': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'nama_pt': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'bentuk_pt': forms.Select(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'status_pt': forms.Select(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'alamat': forms.Textarea(attrs={'rows': 3, 'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'kota': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'provinsi': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'telepon': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'website': forms.URLInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'akreditasi': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'rounded border-gray-300 text-primary focus:ring-primary'}),
        }


class MsProgramStudiForm(forms.ModelForm):
    class Meta:
        model = MsProgramStudi
        fields = [
            'kode_prodi', 'nama_prodi', 'jenjang',
            'perguruan_tinggi', 'akreditasi', 'is_active',
        ]
        labels = {
            'kode_prodi': 'Kode Prodi',
            'nama_prodi': 'Nama Program Studi',
            'jenjang': 'Jenjang',
            'perguruan_tinggi': 'Perguruan Tinggi',
            'akreditasi': 'Akreditasi',
            'is_active': 'Aktif',
        }
        widgets = {
            'kode_prodi': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'nama_prodi': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'jenjang': forms.Select(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'perguruan_tinggi': forms.Select(attrs={'class': 'select2-pt w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'akreditasi': forms.TextInput(attrs={'class': 'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'rounded border-gray-300 text-primary focus:ring-primary'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['perguruan_tinggi'].queryset = MsPerguruanTinggi.objects.filter(
            deleted_at__isnull=True, is_active=True
        ).order_by('nama_pt')
