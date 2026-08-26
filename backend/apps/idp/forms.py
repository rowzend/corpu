from django import forms
from .models import IdpAsn


class IdpAsnForm(forms.ModelForm):
    class Meta:
        model = IdpAsn
        fields = [
            'asn', 'atasan_langsung', 'periode_dari', 'periode_sampai',
            'target_penugasan_idp', 'dasar_penyusunan_idp', 'target_kompetensi',
            'status', 'catatan'
        ]
        widgets = {
            'asn': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            }),
            'atasan_langsung': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            }),
            'periode_dari': forms.DateInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                'type': 'date'
            }),
            'periode_sampai': forms.DateInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                'type': 'date'
            }),
            'target_penugasan_idp': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                'placeholder': 'Target penugasan IDP',
                'rows': 4
            }),
            'dasar_penyusunan_idp': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                'placeholder': 'Dasar penyusunan IDP',
                'rows': 4
            }),
            'target_kompetensi': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                'placeholder': 'Target kompetensi',
                'rows': 4
            }),
            'status': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            }),
            'catatan': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                'placeholder': 'Catatan tambahan',
                'rows': 3
            }),
        }
