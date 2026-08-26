import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function renderHtml(text: string): { __html: string } {
    return { __html: text || '' }
}

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,20})/;
const DRIVE_FILE_RE = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const DOCS_RE = /docs\.google\.com\/(presentation|document|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/;

function getYoutubeEmbedId(url: string): string | null {
    const m = url.match(YOUTUBE_RE);
    return m ? m[1] : null;
}

function getDriveEmbedUrl(url: string): string | null {
    const file = url.match(DRIVE_FILE_RE);
    if (file) return `https://drive.google.com/file/d/${file[1]}/preview`;
    const doc = url.match(DOCS_RE);
    if (doc) return `https://docs.google.com/${doc[1]}/d/${doc[2]}/preview`;
    return null;
}

function isDirectFileUrl(url: string): boolean {
    return /\.(pdf|ppt|pptx|doc|docx|xls|xlsx)(\?|$)/i.test(url);
}

function getEmbedHtml(href: string, title?: string): string | null {
    const yt = getYoutubeEmbedId(href);
    if (yt) {
        return `<div class="aspect-video" style="position:relative;width:100%;height:0;padding-bottom:56.25%;margin:16px 0;border-radius:8px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${yt}" title="${(title || '').replace(/"/g, '&quot;')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe></div>`;
    }
    const drive = getDriveEmbedUrl(href);
    if (drive) {
        return `<div style="position:relative;width:100%;height:0;padding-bottom:56.25%;margin:16px 0;border-radius:8px;overflow:hidden"><iframe src="${drive}" title="${(title || '').replace(/"/g, '&quot;')}" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe></div>`;
    }
    if (isDirectFileUrl(href)) {
        const viewer = `https://docs.google.com/viewer?url=${encodeURIComponent(href)}&embedded=true`;
        return `<div style="position:relative;width:100%;height:0;padding-bottom:56.25%;margin:16px 0;border-radius:8px;overflow:hidden"><iframe src="${viewer}" title="${(title || '').replace(/"/g, '&quot;')}" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe></div>`;
    }
    return null;
}

export function enhanceContentEmbeds(html: string): string {
    if (!html || typeof document === 'undefined') return html || '';

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]'));

    anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href') || '';
        const embed = getEmbedHtml(href, anchor.textContent || undefined);
        if (!embed) return;

        const wrapper = doc.createElement('div');
        wrapper.innerHTML = embed;
        anchor.parentNode?.replaceChild(wrapper, anchor);
    });

    return doc.body.innerHTML;
}
