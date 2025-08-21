// Tunggu DOM dimuat sepenuhnya sebelum menjalankan skrip
document.addEventListener('DOMContentLoaded', () => {

    // --- Pemilih Elemen DOM ---
    const taskForm = document.getElementById('new-task-form');
    const taskTitleInput = document.getElementById('new-task-title');
    const taskDescriptionInput = document.getElementById('new-task-description');
    const taskDateTimeInput = document.getElementById('new-task-datetime');
    const taskListContainer = document.getElementById('task-list-container');
    const alarmSound = document.getElementById('alarm-sound');
    const filterBtnsContainer = document.querySelector('.filters');

    // --- Manajemen Status ---
    // Muat tugas dari localStorage atau inisialisasi array kosong
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

// --- Fungsi Inti ---

 // Menyimpan array tugas saat ini ke localStorage.
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

// Merender tugas ke DOM berdasarkan filter saat ini.
    const renderTasks = () => {
        // Clear the list before rendering
        taskListContainer.innerHTML = '';

        // Filter tugas berdasarkan filter saat ini
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'completed') return task.completed;
            if (currentFilter === 'active') return !task.completed;
            return true; // 'all'
        });

        if (filteredTasks.length === 0) {
            taskListContainer.innerHTML = `<li class="no-tasks-message">You're all caught up! ✨</li>`;
            return;
        }

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;

            const alarmTime = task.alarm ? new Date(task.alarm).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '';

            taskItem.innerHTML = `
                <div class="task-content">
                    <p class="task-title">${task.title}</p>
                    ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                    ${task.alarm ? `<p class="task-alarm"><i class="far fa-bell"></i> ${alarmTime}</p>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn-complete" title="${task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}">
                        <i class="fas ${task.completed ? 'fa-undo-alt' : 'fa-check-circle'}"></i>
                    </button>
                    <button class="btn-delete" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            taskListContainer.appendChild(taskItem);
        });
    };

    /**
     * Menambahkan tugas baru.
     * @param {Event} e - Peristiwa pengiriman formulir.
     */
    const addTask = (e) => {
        e.preventDefault(); // Cegah pemuatan ulang halaman

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const alarm = taskDateTimeInput.value;

        if (!title) {
            alert('Task title cannot be empty!');
            return;
        }

        const newTask = {
            id: Date.now(),
            title,
            description,
            alarm,
            completed: false,
            alarmTriggered: false // Untuk mencegah alarm berulang
        };

        tasks.unshift(newTask); // Tambahkan tugas baru ke awal array
        saveTasks();
        renderTasks();

        taskForm.reset();
    };

/**
* Menghapus tugas berdasarkan ID-nya.
* @param {number} id - ID tugas yang akan dihapus.
*/
    const deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    };

/**
* Mengalihkan status penyelesaian tugas.
* @param {number} id - ID tugas yang akan dialihkan.
*/
    const toggleComplete = (id) => {
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    };

/**
* Menangani klik pada daftar tugas untuk tindakan seperti hapus dan selesai.
* @param {Event} e - Peristiwa klik.
*/
    const handleTaskActions = (e) => {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        if (!taskItem) return;

        const taskId = Number(taskItem.dataset.id);

        if (target.closest('.btn-delete')) deleteTask(taskId);
        else if (target.closest('.btn-complete')) toggleComplete(taskId);
    };
    
/**
* Menangani klik pada tombol filter.
* @param {Event} e - Peristiwa klik.
*/
    const handleFilter = (e) => {
        const target = e.target.closest('.filter-btn');
        if (!target) return;

        document.querySelector('.filter-btn.active').classList.remove('active');
        target.classList.add('active');

        currentFilter = target.dataset.filter;
        renderTasks();
    };

// --- Fungsi Alarm ---

    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    };

    const checkAlarms = () => {
        const now = new Date();
        tasks.forEach(task => {
            if (!task.completed && !task.alarmTriggered && task.alarm) {
                if (now >= new Date(task.alarm)) {
                    alarmSound.play();
                    if (Notification.permission === 'granted') {
                        new Notification('Task Reminder!', { body: task.title });
                    } else {
                        alert(`Task Due: ${task.title}`);
                    }
                    task.alarmTriggered = true;
                    saveTasks();
                }
            }
        });
    };

// --- Inisialisasi & Pendengar Acara ---
    requestNotificationPermission();
    renderTasks();
    setInterval(checkAlarms, 15000); // Periksa alarm setiap 15 detik

    taskForm.addEventListener('submit', addTask);
    taskListContainer.addEventListener('click', handleTaskActions);
    filterBtnsContainer.addEventListener('click', handleFilter);
});