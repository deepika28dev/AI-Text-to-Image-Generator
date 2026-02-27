// ── DOM Elements ─────────────────────────────────────────────────────
const promptInput = document.getElementById('promptInput');
const charCount = document.getElementById('charCount');
const generateBtn = document.getElementById('generateBtn');
const errorMsg = document.getElementById('errorMsg');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const historyGrid = document.getElementById('historyGrid');
const historyCount = document.getElementById('historyCount');
const historyEmpty = document.getElementById('historyEmpty');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const deleteModal = document.getElementById('deleteModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

// ── State ────────────────────────────────────────────────────────────
let pendingDeleteId = null;
let pendingDeleteType = null; // 'single' or 'all'

// ── Load History on Page Load ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadHistory);

// ── Character Counter ────────────────────────────────────────────────
promptInput.addEventListener('input', () => {
    const len = promptInput.value.length;
    charCount.textContent = len;
    if (len > 500) {
        promptInput.value = promptInput.value.substring(0, 500);
        charCount.textContent = 500;
    }
});

// ── Generate Image ───────────────────────────────────────────────────
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('Please enter a prompt to generate an image.');
        return;
    }

    setLoading(true);
    hideError();
    resultSection.style.display = 'none';

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (!data.success) {
            showError(data.error || 'Something went wrong. Please try again.');
            return;
        }

        // Display image
        const imgSrc = `data:image/png;base64,${data.image}`;
        resultImage.src = imgSrc;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Refresh history to show the new generation
        loadHistory();

    } catch (err) {
        showError('Network error. Please check your connection and try again.');
    } finally {
        setLoading(false);
    }
});

// ── Download Image ───────────────────────────────────────────────────
downloadBtn.addEventListener('click', () => {
    if (!resultImage.src || resultImage.src === window.location.href) return;
    const link = document.createElement('a');
    link.href = resultImage.src;
    link.download = `ai_image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// ── Enter Key to Generate ────────────────────────────────────────────
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateBtn.click();
    }
});

// ── History: Load ────────────────────────────────────────────────────
async function loadHistory() {
    try {
        const res = await fetch('/history');
        const data = await res.json();

        if (Array.isArray(data)) {
            renderHistory(data);
        } else {
            console.error('History API did not return a list:', data);
            renderHistory([]);
        }
    } catch (err) {
        console.error('Failed to load history:', err);
    }
}

// ── History: Render ──────────────────────────────────────────────────
function renderHistory(generations) {
    historyCount.textContent = generations.length;

    if (generations.length === 0) {
        historyGrid.innerHTML = '';
        historyEmpty.style.display = 'block';
        clearHistoryBtn.style.display = 'none';
        return;
    }

    historyEmpty.style.display = 'none';
    clearHistoryBtn.style.display = 'flex';

    historyGrid.innerHTML = generations.map(gen => `
        <div class="history-card" data-id="${gen.id}">
            <img class="history-card__image"
                 src="${gen.image_url}"
                 alt="${escapeHtml(gen.prompt)}"
                 loading="lazy"
                 onclick="viewImage('${gen.image_url}')">
            <div class="history-card__info">
                <p class="history-card__prompt" title="${escapeHtml(gen.prompt)}">${escapeHtml(gen.prompt)}</p>
                <div class="history-card__footer">
                    <span class="history-card__time">${gen.created_at}</span>
                    <button class="history-card__delete" title="Delete" onclick="confirmDelete(${gen.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ── History: View Full Image ─────────────────────────────────────────
function viewImage(url) {
    resultImage.src = url;
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── History: Confirm Delete (Single) ─────────────────────────────────
function confirmDelete(id) {
    pendingDeleteId = id;
    pendingDeleteType = 'single';
    modalTitle.textContent = 'Delete this generation?';
    modalText.textContent = 'The image and its record will be permanently removed.';
    deleteModal.style.display = 'flex';
}

// ── History: Clear All ───────────────────────────────────────────────
clearHistoryBtn.addEventListener('click', () => {
    pendingDeleteType = 'all';
    modalTitle.textContent = 'Clear all history?';
    modalText.textContent = 'All generated images and records will be permanently deleted.';
    deleteModal.style.display = 'flex';
});

// ── Modal: Cancel ────────────────────────────────────────────────────
modalCancel.addEventListener('click', closeModal);

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeModal();
});

function closeModal() {
    deleteModal.style.display = 'none';
    pendingDeleteId = null;
    pendingDeleteType = null;
}

// ── Modal: Confirm Delete ────────────────────────────────────────────
modalConfirm.addEventListener('click', async () => {
    const actionType = pendingDeleteType;
    const id = pendingDeleteId;
    closeModal();

    try {
        let res;
        if (actionType === 'single' && id) {
            res = await fetch(`/history/${id}`, { method: 'DELETE' });
        } else if (actionType === 'all') {
            res = await fetch('/history/clear', { method: 'DELETE' });
        }

        if (!res || !res.ok) {
            showError('Failed to delete. Please try again.');
            return;
        }

        loadHistory();
    } catch (err) {
        showError('Failed to delete. Please try again.');
    }
});

// ── Helpers ──────────────────────────────────────────────────────────
function setLoading(loading) {
    generateBtn.disabled = loading;
    generateBtn.querySelector('.generate-btn__default').style.display = loading ? 'none' : 'flex';
    generateBtn.querySelector('.generate-btn__loading').style.display = loading ? 'flex' : 'none';
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

function hideError() {
    errorMsg.style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
