document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initPage('create-request');
    } catch (error) {
        console.error('Sahifa yuklashda xato:', error);
        showNotification('Sahifa yuklashda xatolik yuz berdi', 'error');
    }
});

const form = document.getElementById('dashboardServiceRequestForm');

form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const submitText = document.getElementById('submitText');
        const submitLoader = document.getElementById('submitLoader');

        submitButton.disabled = true;
        submitText.textContent = 'Yuborilmoqda...';
        submitLoader.classList.remove('hidden');

        const formData = new FormData(form);
        try {
            await api('/service/create', {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(formData))
            });
            showNotification('Xizmat so‘rovi muvaffaqiyatli yuborildi! 24 soat ichida siz bilan bog‘lanamiz.', 'success');
            form.reset();
        } catch (error) {
            showNotification(error.message || 'Xizmat so‘rovini yuborishda xatolik', 'error');
        } finally {
            submitButton.disabled = false;
            submitText.textContent = 'So‘rovni Yuborish';
            submitLoader.classList.add('hidden');
        }
});