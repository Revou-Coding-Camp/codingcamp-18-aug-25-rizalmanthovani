document.addEventListener('DOMContentLoaded', () => {
    // --- Pengelompokan Elemen DOM ---
    const elements = {
        // Modal Konfirmasi
        confirmOverlay: document.getElementById('custom-confirm-overlay'),
        confirmModal: document.getElementById('custom-confirm-modal'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
        // Modal Edit
        editModalOverlay: document.getElementById('edit-modal-overlay'),
        editModal: document.getElementById('edit-modal'),
        editTaskTitleInput: document.getElementById('edit-task-title'),
        editTaskDescriptionInput: document.getElementById('edit-task-description'),
        saveEditBtn: document.getElementById('save-edit-btn'),
        editTaskAlarmInput: document.getElementById('edit-task-datetime'), // Elemen baru dari HTML
        cancelEditBtn: document.getElementById('cancel-edit-btn'),
        newTaskForm: document.getElementById('new-task-form'),
        taskListContainer: document.getElementById('task-list-container'),
        newTaskTitleInput: document.getElementById('new-task-title'),
        newTaskDescriptionInput: document.getElementById('new-task-description'),
        alarmInput: document.getElementById('new-task-datetime'),
        taskTemplate: document.getElementById('task-template'),
        alarmSound: document.getElementById('alarm-sound'), // Tambahkan elemen audio untuk suara alarm
    };

    // --- State Management ---
    let tasks = []; // Satu-satunya sumber kebenaran (Single Source of Truth)
    let taskToModifyId = null; // Kita sekarang menggunakan ID, bukan elemen DOM

    // Fungsi untuk menyimpan tugas ke Local Storage
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // Fungsi untuk memuat tugas dari Local Storage
    const loadTasks = () => {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    };

    // --- Render Function ---
    // Fungsi tunggal untuk me-render semua tugas ke DOM berdasarkan array 'tasks'
    const renderTasks = () => {
        elements.taskListContainer.innerHTML = ''; // Kosongkan list sebelum render ulang
        tasks.forEach(task => {
            // 1. Clone konten dari template, bukan membuat elemen dari nol
            const taskItemClone = elements.taskTemplate.content.cloneNode(true);
            
            // 2. Dapatkan referensi ke elemen di dalam clone
            const taskItem = taskItemClone.querySelector('.task-item');
            const titleEl = taskItemClone.querySelector('.task-title');
            const descriptionEl = taskItemClone.querySelector('.task-description');
            const alarmInfoEl = taskItemClone.querySelector('.task-alarm-info');
            const alarmTextEl = taskItemClone.querySelector('.task-alarm-text');
            const completeBtn = taskItemClone.querySelector('.btn-complete');
            const completeIcon = completeBtn.querySelector('i');

            // 3. Isi data ke dalam elemen-elemen tersebut
            taskItem.dataset.id = task.id;
            titleEl.textContent = task.title;

            if (task.description) {
                descriptionEl.textContent = task.description;
                descriptionEl.style.display = ''; // Tampilkan elemen
            }

            if (task.alarmTimestamp) {
                const alarmDate = new Date(task.alarmTimestamp);
                alarmTextEl.textContent = alarmDate.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                alarmInfoEl.style.display = ''; // Tampilkan elemen
            }

            // 4. Atur status 'completed' dan ikon dinamis
            if (task.completed) {
                taskItem.classList.add('completed');
                completeIcon.classList.remove('fa-check');
                completeIcon.classList.add('fa-rotate-left');
                completeBtn.setAttribute('aria-label', 'Mark as Active');
            } else {
                completeIcon.classList.remove('fa-rotate-left');
                completeIcon.classList.add('fa-check');
                completeBtn.setAttribute('aria-label', 'Complete Task');
            }

            // 5. Tambahkan item tugas yang sudah jadi ke dalam kontainer
            elements.taskListContainer.appendChild(taskItemClone);
        });
        applyCurrentFilter(); // Terapkan filter setiap kali render ulang
    };


    // Event listener untuk form penambahan task
    elements.newTaskForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Mencegah form dari reload halaman

        const newTask = {
            id: Date.now().toString(), // ID unik berbasis timestamp
            title: elements.newTaskTitleInput.value.trim(),
            description: elements.newTaskDescriptionInput.value.trim(),
            alarmTimestamp: elements.alarmInput.value,
            completed: false,
            timeoutId: null, // Properti baru untuk menyimpan ID timeout alarm
        };

        if (newTask.title === '') {
            alert('Task title cannot be empty!');
            return;
        }

        // Jika ada alarm, jadwalkan notifikasinya
        if (newTask.alarmTimestamp) {
            // Simpan ID timeout yang dikembalikan oleh fungsi
            newTask.timeoutId = scheduleNotification(newTask.title, newTask.alarmTimestamp);
        }

        tasks.push(newTask);
        saveTasks();
        renderTasks();

        // Reset semua form fields, termasuk alarm
        elements.newTaskForm.reset();
    });

    // Fungsi untuk menjadwalkan notifikasi
    const scheduleNotification = async (taskTitle, alarmTimestamp) => {
        const alarmTime = new Date(alarmTimestamp);
        const now = new Date();
        const delay = alarmTime.getTime() - now.getTime();

        if (delay <= 0) return; // Jangan set alarm untuk waktu yang sudah lewat

        // Minta izin jika diperlukan (tanpa mengganggu pengguna dengan alert)
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            const timeoutId = setTimeout(() => {
                // Tampilkan notifikasi visual
                new Notification('Alarm Tugas!', { body: `Waktunya untuk: ${taskTitle}`, icon: 'assets/bell-icon.png' });

                // Mainkan suara alarm
                if (elements.alarmSound) {
                    // Mengatur ulang audio untuk memastikan bisa diputar lagi
                    elements.alarmSound.currentTime = 0; 
                    const playPromise = elements.alarmSound.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.error("Gagal memutar audio alarm:", error);
                        });
                    }
                }
            }, delay);
            // Kembalikan ID agar bisa disimpan dan dibatalkan nanti
            return timeoutId;
        }
    };

    // Fungsi untuk memeriksa dan menyelesaikan tugas yang sudah lewat waktu alarm
    const checkOverdueTasks = () => {
        let tasksModified = false;
        const now = new Date();

        tasks.forEach(task => {
            // Cek jika tugas aktif, punya alarm, dan sudah lewat waktu
            if (!task.completed && task.alarmTimestamp && new Date(task.alarmTimestamp) < now) {
                task.completed = true;
                tasksModified = true;
            }
        });

        // Hanya render ulang jika ada perubahan, untuk efisiensi
        if (tasksModified) {
            saveTasks();
            renderTasks();
        }
    };

    // Fungsi terpusat untuk menerapkan filter yang sedang aktif
    const applyCurrentFilter = () => {
        // Mengubah fallback ke 'active' karena tombol 'All' sudah tidak ada.
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'active';
        const tasks = document.querySelectorAll('.task-item');

        tasks.forEach(task => {
            switch (activeFilter) {
                case 'active':
                    task.style.display = task.classList.contains('completed') ? 'none' : 'flex';
                    break;
                case 'completed':
                    task.style.display = task.classList.contains('completed') ? 'flex' : 'none';
                    break;
            }
        });
    };

    // --- Fungsi untuk Modal Konfirmasi ---
    const showConfirmModal = (taskId, buttonElement) => {
        taskToModifyId = taskId;
        const rect = buttonElement.getBoundingClientRect();
        
        // Posisikan modal di bawah dan di tengah tombol hapus
        elements.confirmModal.style.top = `${rect.bottom + window.scrollY + 10}px`;
        elements.confirmModal.style.left = `${rect.left + rect.width / 2}px`;
        elements.confirmModal.style.transform = `translateX(-50%)`; // Koreksi posisi horizontal

        elements.confirmOverlay.classList.add('visible');
    };

    const hideConfirmModal = () => {
        elements.confirmOverlay.classList.remove('visible');
        taskToModifyId = null;
    };

    // --- Fungsi untuk Modal Edit ---
    const showEditModal = (taskId) => {
        taskToModifyId = taskId;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        elements.editTaskTitleInput.value = task.title;
        elements.editTaskDescriptionInput.value = task.description;

        // Safeguard: Pastikan elemen input alarm ada sebelum mencoba mengaturnya.
        if (elements.editTaskAlarmInput) {
            elements.editTaskAlarmInput.value = task.alarmTimestamp || '';
        }
        elements.editModalOverlay.classList.add('visible');
    };

    const hideEditModal = () => {
        elements.editModalOverlay.classList.remove('visible');
        taskToModifyId = null;
    };

    // Event listener untuk tombol complete dan delete pada list task
    elements.taskListContainer.addEventListener('click', (event) => {
        const actionButton = event.target.closest('.btn-action');
        if (!actionButton) return;

        const taskItem = actionButton.closest('.task-item');

        const taskId = taskItem.dataset.id;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        if (actionButton.classList.contains('btn-complete')) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
        }

        if (actionButton.classList.contains('btn-edit')) {
            showEditModal(taskId);
        }

        if (actionButton.classList.contains('btn-delete')) {
            // Ganti window.confirm dengan modal kustom
            showConfirmModal(taskId, actionButton);
        }
    });

    // --- Event Listeners untuk Tombol Modal Hapus ---
    elements.confirmDeleteBtn.addEventListener('click', () => {
        if (taskToModifyId) {
            // Sebelum menghapus, batalkan alarm yang mungkin sedang berjalan
            const taskToDelete = tasks.find(t => t.id === taskToModifyId);
            if (taskToDelete && taskToDelete.timeoutId) {
                clearTimeout(taskToDelete.timeoutId);
            }

            tasks = tasks.filter(t => t.id !== taskToModifyId);
            saveTasks();
            renderTasks();
        }
        hideConfirmModal();
    });

    elements.cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    elements.confirmOverlay.addEventListener('click', (e) => {
        if (e.target === elements.confirmOverlay) {
            hideConfirmModal();
        }
    });

    // --- Event Listeners untuk Tombol Modal Edit ---
    elements.saveEditBtn.addEventListener('click', () => {
        if (taskToModifyId) {
            const taskIndex = tasks.findIndex(t => t.id === taskToModifyId);
            if (taskIndex > -1) {
                // 1. Batalkan alarm lama sebelum memperbarui
                const oldTask = tasks[taskIndex];
                if (oldTask.timeoutId) {
                    clearTimeout(oldTask.timeoutId);
                }

                // 2. Perbarui properti tugas
                tasks[taskIndex].title = elements.editTaskTitleInput.value.trim();
                tasks[taskIndex].description = elements.editTaskDescriptionInput.value.trim();
                tasks[taskIndex].alarmTimestamp = elements.editTaskAlarmInput.value; // Simpan alarm yang diperbarui

                // 3. Jika alarm baru diatur untuk masa depan, pastikan tugas kembali aktif.
                if (tasks[taskIndex].alarmTimestamp && new Date(tasks[taskIndex].alarmTimestamp) > new Date()) {
                    tasks[taskIndex].completed = false;
                }

                // 4. Jadwalkan alarm baru jika ada, dan simpan ID-nya
                if (tasks[taskIndex].alarmTimestamp) {
                    tasks[taskIndex].timeoutId = scheduleNotification(tasks[taskIndex].title, tasks[taskIndex].alarmTimestamp);
                }

                saveTasks();
                renderTasks();
            }
        }
        hideEditModal();
    });
    elements.cancelEditBtn.addEventListener('click', hideEditModal);
    elements.editModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.editModalOverlay) {
            hideEditModal();
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

    // --- Inisialisasi Aplikasi ---
    loadTasks();
    renderTasks();
    // Periksa tugas yang terlambat saat memuat dan setiap 30 detik setelahnya
    checkOverdueTasks();
    setInterval(checkOverdueTasks, 30000); // 30000 ms = 30 detik
});