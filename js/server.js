document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen untuk Modal Konfirmasi Kustom ---
    const confirmOverlay = document.getElementById('custom-confirm-overlay');
    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    // Variabel untuk menyimpan task yang akan dihapus
    let taskToDelete = null;

    const newTaskForm = document.getElementById('new-task-form');
    const taskListContainer = document.getElementById('task-list-container');
    const newTaskTitleInput = document.getElementById('new-task-title');
    const newTaskDescriptionInput = document.getElementById('new-task-description');

    // Fungsi untuk membuat elemen task baru
    const createTaskElement = (title, description) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const taskTitle = document.createElement('h3');
        taskTitle.textContent = title;

        const taskDescription = document.createElement('p');
        taskDescription.textContent = description;

        taskContent.appendChild(taskTitle);
        if (description) {
            taskContent.appendChild(taskDescription);
        }

        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';

        const completeButton = document.createElement('button');
        completeButton.className = 'btn-action btn-complete';
        completeButton.innerHTML = '<i class="fa-solid fa-check"></i>';
        completeButton.setAttribute('aria-label', 'Complete Task');

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-action btn-delete';
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteButton.setAttribute('aria-label', 'Delete Task');

        taskActions.appendChild(completeButton);
        taskActions.appendChild(deleteButton);

        taskItem.appendChild(taskContent);
        taskItem.appendChild(taskActions);

        return taskItem;
    };

    // Event listener untuk form penambahan task
    newTaskForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Mencegah form dari reload halaman

        const title = newTaskTitleInput.value.trim();
        const description = newTaskDescriptionInput.value.trim();

        if (title === '') {
            alert('Task title cannot be empty!');
            return;
        }

        const taskElement = createTaskElement(title, description);
        taskListContainer.appendChild(taskElement);

        // Reset form fields
        newTaskTitleInput.value = '';
        newTaskDescriptionInput.value = '';
    });

    // Fungsi terpusat untuk menerapkan filter yang sedang aktif
    const applyCurrentFilter = () => {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        const tasks = document.querySelectorAll('.task-item');

        tasks.forEach(task => {
            switch (activeFilter) {
                case 'active':
                    task.style.display = task.classList.contains('completed') ? 'none' : '';
                    break;
                case 'completed':
                    task.style.display = task.classList.contains('completed') ? '' : 'none';
                    break;
                default: // 'all'
                    task.style.display = '';
                    break;
            }
        });
    };

    // --- Fungsi untuk Modal Konfirmasi ---
    const showConfirmModal = (taskElement, buttonElement) => {
        taskToDelete = taskElement;
        const rect = buttonElement.getBoundingClientRect();
        
        // Posisikan modal di bawah dan di tengah tombol hapus
        confirmModal.style.top = `${rect.bottom + window.scrollY + 10}px`;
        confirmModal.style.left = `${rect.left + rect.width / 2}px`;
        confirmModal.style.transform = `translateX(-50%)`; // Koreksi posisi horizontal

        confirmOverlay.classList.add('visible');
    };

    const hideConfirmModal = () => {
        confirmOverlay.classList.remove('visible');
        taskToDelete = null;
    };
    // Event listener untuk tombol complete dan delete pada list task
    taskListContainer.addEventListener('click', (event) => {
        const actionButton = event.target.closest('.btn-action');
        if (!actionButton) return;

        const taskItem = actionButton.closest('.task-item');

        if (actionButton.classList.contains('btn-complete')) {
            taskItem.classList.toggle('completed');
            applyCurrentFilter(); // Terapkan filter setelah status tugas berubah
        }

        if (actionButton.classList.contains('btn-delete')) {
            // Ganti window.confirm dengan modal kustom
            showConfirmModal(taskItem, actionButton);
        }
    });

    // --- Event Listeners untuk Tombol Modal ---
    confirmDeleteBtn.addEventListener('click', () => {
        if (taskToDelete) {
            taskToDelete.remove();
        }
        hideConfirmModal();
    });

    cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    confirmOverlay.addEventListener('click', (event) => {
        if (event.target === confirmOverlay) {
            hideConfirmModal();
        }
    });
    // Event listener untuk tombol filter
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.filter-btn.active')?.classList.remove('active');
            button.classList.add('active');
            applyCurrentFilter(); // Panggil fungsi filter yang sudah dibuat
        });
    });

    // --- Logika untuk Tombol Alarm ---
    // Dipindahkan ke sini agar hanya dijalankan sekali saat halaman dimuat.
    const alarmButton = document.getElementById('set-alarm-btn');

    if (alarmButton) {
        alarmButton.addEventListener('click', (event) => {
            // Mencegah form tersubmit jika tombol ini ada di dalam form
            event.preventDefault();
            // Logika untuk menyetel alarm bisa ditambahkan di sini.
            // Baris classList.toggle() dihapus karena tidak lagi diperlukan.
        });
    }
});