import { TeamManager } from './teamManagement.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize collapsible sections
    const collapsibleSections = document.querySelectorAll('.collapsible-section');
    collapsibleSections.forEach(section => {
        const header = section.querySelector('.section-header');

        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on buttons within the header
            if (e.target.matches('button:not(.collapse-toggle)')) {
                return;
            }
            section.classList.toggle('collapsed');
            localStorage.setItem(`section-${section.querySelector('h2').textContent}-collapsed`,
                section.classList.contains('collapsed'));
        });
    });

    // Restore collapsed state from localStorage
    collapsibleSections.forEach(section => {
        const sectionName = section.querySelector('h2').textContent;
        const isCollapsed = localStorage.getItem(`section-${sectionName}-collapsed`) === 'true';
        if (isCollapsed) {
            section.classList.add('collapsed');
        }
    });

    // DOM Elements
    const newTeamNameInput = document.getElementById('newTeamName');
    const addTeamButton = document.getElementById('addTeamButton');
    const memberNameInput = document.getElementById('memberName');
    const addMemberButton = document.getElementById('addMemberButton');
    const teamMembersContainer = document.getElementById('teamMembers');
    const pickButton = document.getElementById('pickButton');
    const resetButton = document.getElementById('resetButton');
    const currentSpeakerContainer = document.getElementById('currentSpeaker');
    const allDoneMessageContainer = document.getElementById('allDoneMessage');
    const notificationElement = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationClose = document.querySelector('.notification-close');

    let remainingMembers = [];
    const teamManager = new TeamManager();

    // Show notification
    function showNotification(message, type = 'info', withConfirm = false) {
        // Remove any existing confirm buttons
        const existingConfirmButton = notificationElement.querySelector('.confirm-button');
        if (existingConfirmButton) {
            notificationElement.removeChild(existingConfirmButton);
        }

        notificationMessage.textContent = message;
        notificationElement.className = `notification ${type}`;
        notificationElement.style.display = 'flex';

        if (!withConfirm) {
            setTimeout(() => {
                notificationElement.style.display = 'none';
            }, 5000);
        }
    }

    // Close notification
    notificationClose.addEventListener('click', () => {
        notificationElement.style.display = 'none';
        // Remove any confirm buttons when closing
        const confirmButton = notificationElement.querySelector('.confirm-button');
        if (confirmButton) {
            notificationElement.removeChild(confirmButton);
        }
    });

    // Update team list
    function updateTeamList(teams) {
        const teamList = document.getElementById('teamList');
        const teamNames = Object.keys(teams);
        const currentTeam = teamManager.getCurrentTeam();

        // Main team list
        teamList.innerHTML = teamNames.length ? teamNames.map(teamName => `
            <li data-team="${teamName}" class="${currentTeam === teamName ? 'active' : ''}">
                ${teamName}
                <span class="team-count">${teams[teamName].length} members</span>
                <button class="edit-team-button" data-team="${teamName}">Edit</button>
                <button class="delete-team-button" data-team="${teamName}">Delete</button>
            </li>
        `).join('') : '<li class="empty-state">No teams yet</li>';

        // Add click handlers for team selection, editing, and deletion
        teamList.querySelectorAll('li[data-team]').forEach(li => {
            // Team selection handler
            li.addEventListener('click', (e) => {
                if (!e.target.matches('.edit-team-button') && !e.target.matches('.delete-team-button')) {
                    loadTeam(li.dataset.team);
                }
            });

            // Edit button handler
            const editButton = li.querySelector('.edit-team-button');
            if (editButton) {
                editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editTeam(e.target.dataset.team);
                });
            }

            // Delete button handler
            const deleteButton = li.querySelector('.delete-team-button');
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTeam(e.target.dataset.team);
                });
            }
        });
    }

    function deleteTeam(teamName) {
        showNotification(`Are you sure you want to delete the team "${teamName}"?`, 'warning', true);
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.className = 'confirm-button';
        confirmButton.addEventListener('click', () => {
            const resetRequired = teamManager.deleteTeam(teamName);
            if (resetRequired) {
                teamMembersContainer.innerHTML = '';
                resetDisplay();
            }
            showNotification(`Team "${teamName}" has been deleted.`, 'success');
        });
        notificationElement.appendChild(confirmButton);
    }

    function editTeam(teamName) {
        const newTeamName = prompt(`Enter new name for team "${teamName}"`, teamName);

        if (newTeamName && newTeamName !== teamName) {
            const result = teamManager.editTeam(teamName, newTeamName);
            if (result.success) {
                showNotification(result.message, 'success');
            } else {
                showNotification(result.error, 'error');
            }
        }
    }

    // Load selected team
    function loadTeam(teamName) {
        const members = teamManager.loadTeam(teamName);
        if (members) {
            remainingMembers = [...members];
            renderTeamMembers(members);
            resetDisplay();
        } else {
            showNotification('Failed to load team. Please try again.', 'error');
        }
    }

    // Remove team member
    function removeTeamMember(teamName, memberName) {
        const result = teamManager.removeTeamMember(teamName, memberName);
        if (result.success) {
            if (teamName === teamManager.getCurrentTeam()) {
                renderTeamMembers(teamManager.getCurrentTeamMembers());
                remainingMembers = remainingMembers.filter(member => member !== memberName);
            }
            if (result.teamDeleted) {
                teamMembersContainer.innerHTML = '';
                resetDisplay();
            }
            showNotification(`${memberName} has been removed from the team.`, 'info');
        }
    }

    // Render team members
    function renderTeamMembers(members) {
        const currentTeam = teamManager.getCurrentTeam();
        teamMembersContainer.innerHTML = members.map(member => `
            <div class="team-member">
                <div class="member-controls">
                    <input type="checkbox" id="${member}" name="${member}" checked>
                    <label for="${member}">${member}</label>
                </div>
                <button class="remove-button" data-member="${member}">×</button>
            </div>
        `).join('');

        // Add event listeners for remove buttons
        teamMembersContainer.querySelectorAll('.remove-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const memberName = e.target.dataset.member;
                showNotification(`Are you sure you want to remove ${memberName} from the team?`, 'warning', true);
                const confirmButton = document.createElement('button');
                confirmButton.textContent = 'Confirm';
                confirmButton.className = 'confirm-button';
                confirmButton.addEventListener('click', () => {
                    removeTeamMember(currentTeam, memberName);
                });
                notificationElement.appendChild(confirmButton);
            });
        });
    }

    // Reset display
    function resetDisplay() {
        currentSpeakerContainer.innerHTML = '';
        allDoneMessageContainer.style.display = 'none';
    }

    // Check if all available members have spoken
    function allAvailableMembersHaveSpoken() {
        const availableNames = getCurrentTeamMembers().filter(member =>
            document.querySelector(`input[name="${member}"]`).checked
        );
        return remainingMembers.length === 0 && availableNames.length > 0;
    }

    // Get current team members
    function getCurrentTeamMembers() {
        return teamManager.getCurrentTeamMembers();
    }

    // Set up team manager update handler
    teamManager.onTeamUpdate = (teams) => {
        updateTeamList(teams);
    };

    // Event Listeners
    addTeamButton.addEventListener('click', () => {
        const teamName = newTeamNameInput.value.trim();
        if (!teamName) {
            showNotification('Please enter a team name.', 'error');
            return;
        }

        if (teamManager.createTeam(teamName)) {
            newTeamNameInput.value = '';
            showNotification('Team created successfully.', 'success');
        } else {
            showNotification('This team already exists.', 'warning');
        }
    });

    addMemberButton.addEventListener('click', () => {
        const currentTeam = teamManager.getCurrentTeam();
        if (!currentTeam) {
            showNotification('Please select a team first.', 'error');
            return;
        }

        const memberName = memberNameInput.value.trim();
        if (!memberName) {
            showNotification('Please enter a member name.', 'error');
            return;
        }

        if (teamManager.addTeamMember(currentTeam, memberName)) {
            memberNameInput.value = '';
            showNotification('Team member added successfully.', 'success');
        } else {
            showNotification('This member already exists in the team.', 'warning');
        }
    });

    pickButton.addEventListener('click', () => {
        const currentTeam = teamManager.getCurrentTeam();
        if (!currentTeam) {
            showNotification('Please select a team first.', 'error');
            return;
        }

        const availableNames = getCurrentTeamMembers().filter(member =>
            document.querySelector(`input[name="${member}"]`).checked
        );

        if (availableNames.length === 0) {
            showNotification('Please select at least one team member.', 'error');
            return;
        }

        if (allAvailableMembersHaveSpoken()) {
            currentSpeakerContainer.innerHTML = '<span class="all-done">All Done!</span>';
            allDoneMessageContainer.style.display = 'block';
            showNotification('All members have spoken. Round complete!', 'success');
            return;
        }

        if (remainingMembers.length === 0) {
            remainingMembers = [...availableNames];
        }

        remainingMembers = remainingMembers.filter(member => availableNames.includes(member));

        if (remainingMembers.length === 0) {
            showNotification('All available members have spoken. Click Reset to start a new round.', 'warning');
            return;
        }

        const index = Math.floor(Math.random() * remainingMembers.length);
        const picked = remainingMembers[index];
        remainingMembers.splice(index, 1);

        currentSpeakerContainer.innerHTML = `<span class="selected-name">${picked}</span>`;
        allDoneMessageContainer.style.display = 'none';

        // Add and remove animation class
        currentSpeakerContainer.classList.add('animate-new-speaker');
        setTimeout(() => {
            currentSpeakerContainer.classList.remove('animate-new-speaker');
        }, 500);
    });

    resetButton.addEventListener('click', () => {
        const currentTeam = teamManager.getCurrentTeam();
        if (!currentTeam) {
            showNotification('Please select a team first.', 'error');
            return;
        }

        showNotification('Are you sure you want to reset the speaking order?', 'warning', true);
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.className = 'confirm-button';
        confirmButton.addEventListener('click', () => {
            remainingMembers = [...getCurrentTeamMembers()];
            resetDisplay();
            showNotification('Speaking order has been reset.', 'info');
        });
        notificationElement.appendChild(confirmButton);
    });

    // Initialize the app
    teamManager.initializeTeams();
});
