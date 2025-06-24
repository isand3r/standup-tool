document.addEventListener('DOMContentLoaded', () => {
    const teamMembersContainer = document.getElementById('teamMembers');
    const pickButton = document.getElementById('pickButton');
    const resetButton = document.getElementById('resetButton');
    const currentSpeakerContainer = document.getElementById('currentSpeaker');
    const speakingOrderContainer = document.getElementById('speakingOrder');
    const allDoneMessageContainer = document.getElementById('allDoneMessage');

    let teamMembers = [];
    let speakingOrder = [];
    let remainingMembers = [];

    // Fetch team members
    fetch('/api/team')
        .then(response => response.json())
        .then(data => {
            teamMembers = data;
            remainingMembers = [...teamMembers];
            renderTeamMembers();
            loadSpeakingOrder();
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

    // Load speaking order from localStorage
    function loadSpeakingOrder() {
        const savedOrder = localStorage.getItem('standupSpeakingOrder');
        const savedRemaining = localStorage.getItem('standupRemainingMembers');

        if (savedOrder) {
            speakingOrder = JSON.parse(savedOrder);
            renderSpeakingOrder();
        }

        if (savedRemaining) {
            remainingMembers = JSON.parse(savedRemaining);
        }
    }

    // Save speaking order to localStorage
    function saveSpeakingOrder() {
        localStorage.setItem('standupSpeakingOrder', JSON.stringify(speakingOrder));
        localStorage.setItem('standupRemainingMembers', JSON.stringify(remainingMembers));
    }

    // Check if all available members have spoken
    function allAvailableMembersHaveSpoken() {
        const availableNames = teamMembers.filter(member =>
            document.querySelector(`input[name="${member}"]`).checked
        );
        return speakingOrder.length > 0 &&
               availableNames.every(name => speakingOrder.includes(name));
    }

    // Pick next speaker
    pickButton.addEventListener('click', () => {
        const availableNames = teamMembers.filter(member =>
            document.querySelector(`input[name="${member}"]`).checked
        );

        if (availableNames.length === 0) {
            alert('Please select at least one team member.');
            return;
        }

        if (allAvailableMembersHaveSpoken()) {
            currentSpeakerContainer.innerHTML = '<span class="all-done">All Done!</span>';
            allDoneMessageContainer.style.display = 'block';
            return;
        }

        // Reset remaining members if all have spoken
        if (remainingMembers.length === 0) {
            remainingMembers = availableNames.filter(name => !speakingOrder.includes(name));
            if (remainingMembers.length === 0) {
                remainingMembers = [...availableNames];
            }
        }

        // Filter remaining members by availability
        remainingMembers = remainingMembers.filter(member => availableNames.includes(member));

        if (remainingMembers.length === 0) {
            alert('All available members have spoken. Click Reset to start a new round.');
            return;
        }

        const index = Math.floor(Math.random() * remainingMembers.length);
        const picked = remainingMembers[index];
        remainingMembers.splice(index, 1);

        speakingOrder.push(picked);
        currentSpeakerContainer.innerHTML = `<span class="selected-name">${picked}</span>`;
        allDoneMessageContainer.style.display = 'none';
        renderSpeakingOrder();
        saveSpeakingOrder();
    });

    // Reset speaking order
    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the speaking order?')) {
            speakingOrder = [];
            remainingMembers = [...teamMembers];
            currentSpeakerContainer.innerHTML = '';
            allDoneMessageContainer.style.display = 'none';
            renderSpeakingOrder();
            saveSpeakingOrder();
        }
    });

    // Render speaking order
    function renderSpeakingOrder() {
        if (speakingOrder.length === 0) {
            speakingOrderContainer.innerHTML = '<div class="history-entry">No updates given yet</div>';
            return;
        }

        speakingOrderContainer.innerHTML = speakingOrder.map((name, index) => `
            <div class="history-entry">
                <div class="history-date">#${index + 1}</div>
                <div>${name}</div>
            </div>
        `).join('');
    }
});
