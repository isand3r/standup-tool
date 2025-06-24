document.addEventListener('DOMContentLoaded', () => {
    const teamMembersContainer = document.getElementById('teamMembers');
    const pickButton = document.getElementById('pickButton');
    const resetButton = document.getElementById('resetButton');
    const selectedNamesContainer = document.getElementById('selectedNames');
    const historyListContainer = document.getElementById('historyList');

    let teamMembers = [];

    // Fetch team members
    fetch('/api/team')
        .then(response => response.json())
        .then(data => {
            teamMembers = data;
            renderTeamMembers();
        });

    // Render team members
    function renderTeamMembers() {
        teamMembersContainer.innerHTML = teamMembers.map(member => `
            <div class="team-member">
                <input type="checkbox" id="${member}" name="${member}" checked>
                <label for="${member}">${member}</label>
            </div>
        `).join('');
    }

    // Pick names
    pickButton.addEventListener('click', () => {
        const availableNames = teamMembers.filter(member =>
            document.querySelector(`input[name="${member}"]`).checked
        );

        if (availableNames.length < 2) {
            alert('Please select at least two team members.');
            return;
        }

        fetch('/api/pick', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ availableNames }),
        })
        .then(response => response.json())
        .then(data => {
            selectedNamesContainer.innerHTML = data.map(name =>
                `<span class="selected-name">${name}</span>`
            ).join('');
            updateHistory();
        });
    });

    // Reset history
    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the selection history?')) {
            fetch('/api/reset', { method: 'POST' })
                .then(() => {
                    selectedNamesContainer.innerHTML = '';
                    updateHistory();
                });
        }
    });

    // Update history
    function updateHistory() {
        fetch('/api/history')
            .then(response => response.json())
            .then(data => {
                historyListContainer.innerHTML = data.selections.map(entry => `
                    <div class="history-entry">
                        <div class="history-date">${new Date(entry.date).toLocaleString()}</div>
                        <div>${entry.names.join(', ')}</div>
                    </div>
                `).join('');
            });
    }

    // Initial history load
    updateHistory();
});
