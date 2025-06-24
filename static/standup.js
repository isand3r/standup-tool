import { teamMembers } from './team-members.js';

document.addEventListener('DOMContentLoaded', () => {
    const teamMembersContainer = document.getElementById('teamMembers');
    const pickButton = document.getElementById('pickButton');
    const resetButton = document.getElementById('resetButton');
    const currentSpeakerContainer = document.getElementById('currentSpeaker');
    const allDoneMessageContainer = document.getElementById('allDoneMessage');

    let remainingMembers = [...teamMembers];

    renderTeamMembers();

    // Render team members
    function renderTeamMembers() {
        teamMembersContainer.innerHTML = teamMembers.map(member => `
            <div class="team-member">
                <input type="checkbox" id="${member}" name="${member}" checked>
                <label for="${member}">${member}</label>
            </div>
        `).join('');
    }

    // Check if all available members have spoken
    function allAvailableMembersHaveSpoken() {
        const availableNames = teamMembers.filter(member =>
            document.querySelector(`input[name="${member}"]`).checked
        );
        return remainingMembers.length === 0 && availableNames.length > 0;
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
            remainingMembers = [...availableNames];
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

        currentSpeakerContainer.innerHTML = `<span class="selected-name">${picked}</span>`;
        allDoneMessageContainer.style.display = 'none';
    });

    // Reset speaking order
    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the speaking order?')) {
            remainingMembers = [...teamMembers];
            currentSpeakerContainer.innerHTML = '';
            allDoneMessageContainer.style.display = 'none';
        }
    });
});
