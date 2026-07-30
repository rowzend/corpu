/**
 * SweetAlert2 Utility Wrapper
 * Provides consistent alert/confirm dialogs across the application
 */

import Swal from 'sweetalert2';

/**
 * Show success message
 */
export const showSuccess = (message: string, title: string = 'Berhasil!') => {
    return Swal.fire(swalBase({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
        timer: 3000,
        timerProgressBar: true,
    }));
};

/**
 * Show error message
 */
export const showError = (message: string, title: string = 'Error!') => {
    return Swal.fire(swalBase({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
        heightAuto: false,
        backdrop: true
    }));
};

/**
 * Show warning message
 */
export const showWarning = (message: string, title: string = 'Peringatan!') => {
    return Swal.fire(swalBase({
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
    }));
};

/**
 * Show info message
 */
export const showInfo = (message: string, title: string = 'Informasi') => {
    return Swal.fire(swalBase({
        icon: 'info',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6',
    }));
};

/**
 * Helper: disable Radix UI dialog overlay/body events so SweetAlert is clickable
 */
function disableDialogOverlay(disable: boolean) {
    // Disable Radix overlay so clicks pass through to SweetAlert
    const elements = document.querySelectorAll(
        '[data-radix-dialog-overlay]'
    );
    elements.forEach(el => {
        if (disable) {
            (el as HTMLElement).style.pointerEvents = 'none';
        } else {
            (el as HTMLElement).style.pointerEvents = '';
        }
    });

    // Ensure SweetAlert2 container is clickable even when Radix
    // sets body pointer-events=none (DismissableLayer)
    const swalContainer = document.querySelector('.swal2-container');
    if (swalContainer) {
        (swalContainer as HTMLElement).style.pointerEvents = disable ? 'auto' : '';
    }
    const swalPopup = document.querySelector('.swal2-popup');
    if (swalPopup) {
        (swalPopup as HTMLElement).style.pointerEvents = disable ? 'auto' : '';
    }
}

/**
 * Base Swal options with z-index fix for Radix UI Dialog
 */
const swalBase = (extra: any = {}) => ({
    ...extra,
    willOpen: (el: HTMLElement) => {
        disableDialogOverlay(true);
        extra.willOpen?.(el);
    },
    didOpen: (el: HTMLElement) => {
        const popup = Swal.getPopup();
        if (popup) {
            popup.focus();
        }
        extra.didOpen?.(el);
    },
    didClose: (el: HTMLElement) => {
        disableDialogOverlay(false);
        extra.didClose?.(el);
    },
    customClass: {
        container: 'swal-high-z-index',
        ...extra.customClass,
    },
});

/**
 * Show confirmation dialog
 */
export const showConfirm = async (
    message: string,
    title: string = 'Konfirmasi',
    confirmButtonText: string = 'Ya',
    cancelButtonText: string = 'Batal'
): Promise<boolean> => {
    const result = await Swal.fire(swalBase({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
    }));

    return result.isConfirmed;
};

/**
 * Show delete confirmation dialog
 */
export const showDeleteConfirm = async (
    itemName: string,
    itemType: string = 'item'
): Promise<boolean> => {
    const result = await Swal.fire(swalBase({
        icon: 'warning',
        title: 'Hapus Data?',
        html: `Apakah Anda yakin ingin menghapus ${itemType} <strong>"${itemName}"</strong>?<br><br>Data yang dihapus tidak dapat dikembalikan.`,
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
    }));

    return result.isConfirmed;
};

/**
 * Show loading dialog
 */
export const showLoading = (message: string = 'Memproses...') => {
    disableDialogOverlay(true);
    return Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        didOpen: () => {
            Swal.showLoading();
            const popup = Swal.getPopup();
            if (popup) popup.focus();
        },
        didClose: () => {
            disableDialogOverlay(false);
        },
    });
};

/**
 * Close loading dialog
 */
export const closeLoading = () => {
    Swal.close();
};

/**
 * Show toast notification (small notification at top-right)
 */
export const showToast = (
    message: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'success',
    position: 'top-end' | 'top' | 'top-start' | 'center' | 'bottom' | 'bottom-start' | 'bottom-end' = 'top-end'
) => {
    const Toast = Swal.mixin({
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
    });

    return Toast.fire({
        icon: icon,
        title: message,
    });
};

/**
 * Show input dialog
 */
export const showInput = async (
    title: string,
    inputLabel: string,
    inputPlaceholder: string = '',
    inputValue: string = '',
    inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' = 'text'
): Promise<string | null> => {
    const result = await Swal.fire(swalBase({
        title: title,
        input: inputType,
        inputLabel: inputLabel,
        inputPlaceholder: inputPlaceholder,
        inputValue: inputValue,
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        inputValidator: (value) => {
            if (!value) {
                return 'Field ini wajib diisi!';
            }
            return null;
        },
    }));

    return result.isConfirmed ? result.value : null;
};

/**
 * Show custom HTML dialog
 */
export const showCustom = (options: any) => {
    return Swal.fire(swalBase(options));
};

// Export Swal for advanced usage
export { Swal };
