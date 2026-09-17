document.addEventListener('DOMContentLoaded', function () {
    const data = JSON.parse(localStorage.getItem('foodiePrebook') || 'null');
    const panel = document.getElementById('prebookPanel');
    if (!panel) return;
    const restaurant = document.getElementById('prebookRestaurant');
    const itemsBox = document.getElementById('prebookItems');
    const totalBox = document.getElementById('prebookBookingTotal');
    const items = Array.isArray(data?.items) ? data.items : [];
    if (restaurant) restaurant.textContent = data?.restaurant_name ? `• ${data.restaurant_name}` : '';
    if (!items.length) {
        if (itemsBox) itemsBox.innerHTML = '<span class="text-muted">No food items selected. You can reserve the table without pre-booking food.</span>';
        if (totalBox) totalBox.textContent = '0';
        return;
    }
    let total = 0;
    if (itemsBox) {
        itemsBox.innerHTML = items.map(item => {
            const line = Number(item.price || 0) * Number(item.quantity || 0);
            total += line;
            return `<div class="d-flex justify-content-between align-items-center border-bottom py-2"><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>₹${line.toFixed(0)}</strong></div>`;
        }).join('');
    }
    if (totalBox) totalBox.textContent = total.toFixed(0);
});
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
