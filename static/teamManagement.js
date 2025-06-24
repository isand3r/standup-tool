// Team Management Module

export class TeamManager {
    constructor() {
        this.currentTeam = '';
        this.onTeamUpdate = null;
    }

    // Initialize teams from localStorage
    initializeTeams() {
        const teams = this.getTeams();
        if (this.onTeamUpdate) {
            this.onTeamUpdate(teams);
        }

        // Load last selected team if any
        const lastTeam = localStorage.getItem('lastSelectedTeam');
        if (lastTeam && teams[lastTeam]) {
            this.loadTeam(lastTeam);
        }
    }

    // Get all teams from localStorage
    getTeams() {
        return JSON.parse(localStorage.getItem('teams')) || {};
    }

    // Delete a team
    deleteTeam(teamName) {
        const teams = this.getTeams();
        delete teams[teamName];
        localStorage.setItem('teams', JSON.stringify(teams));

        if (this.currentTeam === teamName) {
            this.currentTeam = '';
        }

        if (this.onTeamUpdate) {
            this.onTeamUpdate(teams);
        }
        return this.currentTeam === '';
    }

    // Edit team name
    editTeam(oldName, newName) {
        const teams = this.getTeams();
        const team = teams[oldName];

        if (!team) {
            return { success: false, error: 'Team not found.' };
        }

        if (teams[newName]) {
            return { success: false, error: 'A team with this name already exists.' };
        }

        teams[newName] = team;
        delete teams[oldName];
        localStorage.setItem('teams', JSON.stringify(teams));

        if (this.currentTeam === oldName) {
            this.currentTeam = newName;
            localStorage.setItem('lastSelectedTeam', newName);
        }

        if (this.onTeamUpdate) {
            this.onTeamUpdate(teams);
        }

        return {
            success: true,
            message: `Team "${oldName}" has been renamed to "${newName}".`
        };
    }

    // Load selected team
    loadTeam(teamName) {
        const teams = this.getTeams();
        if (teams[teamName]) {
            this.currentTeam = teamName;
            localStorage.setItem('lastSelectedTeam', teamName);
            if (this.onTeamUpdate) {
                this.onTeamUpdate(teams);
            }
            return teams[teamName];
        }
        return null;
    }

    // Add new team member
    addTeamMember(teamName, memberName) {
        const teams = this.getTeams();
        if (!teams[teamName]) {
            teams[teamName] = [];
        }
        if (!teams[teamName].includes(memberName)) {
            teams[teamName].push(memberName);
            localStorage.setItem('teams', JSON.stringify(teams));
            if (this.onTeamUpdate) {
                this.onTeamUpdate(teams);
            }
            return true;
        }
        return false;
    }

    // Remove team member
    removeTeamMember(teamName, memberName) {
        const teams = this.getTeams();
        if (teams[teamName]) {
            teams[teamName] = teams[teamName].filter(member => member !== memberName);
            localStorage.setItem('teams', JSON.stringify(teams));

            // If team is empty, remove it
            if (teams[teamName].length === 0) {
                delete teams[teamName];
                localStorage.setItem('teams', JSON.stringify(teams));
                if (teamName === this.currentTeam) {
                    this.currentTeam = '';
                }
            }

            if (this.onTeamUpdate) {
                this.onTeamUpdate(teams);
            }

            return {
                success: true,
                teamDeleted: teams[teamName] === undefined
            };
        }
        return { success: false };
    }

    // Create new team
    createTeam(teamName) {
        const teams = this.getTeams();
        if (teams[teamName]) {
            return false;
        }

        teams[teamName] = [];
        localStorage.setItem('teams', JSON.stringify(teams));

        if (this.onTeamUpdate) {
            this.onTeamUpdate(teams);
        }
        return true;
    }

    // Get current team members
    getCurrentTeamMembers() {
        const teams = this.getTeams();
        return teams[this.currentTeam] || [];
    }

    // Get current team name
    getCurrentTeam() {
        return this.currentTeam;
    }
}
