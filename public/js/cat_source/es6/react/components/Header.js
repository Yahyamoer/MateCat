
var SubHeader = require("./SubHeader").default;

class Header extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            teams: [],
            selectedTeamId : null
        };
        this.renderTeams = this.renderTeams.bind(this);
        this.updateTeams = this.updateTeams.bind(this);
        this.chooseTeams = this.chooseTeams.bind(this);
        this.openModifyTeam = this.openModifyTeam.bind(this);
    }

    componentDidMount () {
        if (this.state.selectedTeamId) {
            this.dropdownTeams.dropdown('set selected',  this.state.selectedTeamId);
        }
        TeamsStore.addListener(ManageConstants.RENDER_TEAMS, this.renderTeams);
        TeamsStore.addListener(ManageConstants.UPDATE_TEAMs, this.updateTeams);
        TeamsStore.addListener(ManageConstants.CHOOSE_TEAM, this.chooseTeams);
    }

    componentWillUnmount() {
        TeamsStore.removeListener(ManageConstants.RENDER_TEAMS, this.renderTeams);
        TeamsStore.removeListener(ManageConstants.UPDATE_TEAMs, this.updateTeams);
        TeamsStore.removeListener(ManageConstants.CHOOSE_TEAM, this.chooseTeams);
    }

    componentDidUpdate() {
        let self = this;
        if (this.state.teams.size > 0){
            let dropdownTeams = $(this.dropdownTeams);
            if (this.state.selectedTeamId ) {
                setTimeout(function () {
                    dropdownTeams.dropdown('set selected', self.state.selectedTeamId);
                });
            } else {
                dropdownTeams.dropdown();
            }
        }
    }

    changeTeam(event, team) {
        if (this.props.showSubHeader) {
            if (team.get('id')  !== this.state.selectedTeamId) {
                let selectedTeam = this.state.teams.find(function (org) {
                    if (org.get("id") === team.get("id")) {
                        return true;
                    }
                });
                window.scrollTo(0, 0);
                ManageActions.changeTeam(selectedTeam.toJS());
            }
        } else {
            ManageActions.changeTeamFromUploadPage();
        }
    }

    openCreateTeams () {
        ManageActions.openCreateTeamModal();
    }

    openModifyTeam (event, team) {
        event.stopPropagation();
        event.preventDefault();
        $(this.dropdownTeams).dropdown('set selected', '' + this.state.selectedTeamId);
        ManageActions.openModifyTeamModal(team.toJS());
    }

    renderTeams(teams) {
        this.setState({
            teams : teams
        });
    }

    updateTeams(teams) {
        this.setState({
            teams : teams,
        });
    }

    chooseTeams(id) {
        this.setState({
            selectedTeamId : id,
        });
    }

    openPreferencesModal() {
        $('#modal').trigger('openpreferences');
    }

    openLoginModal() {
        $('#modal').trigger('openlogin');
    }

    getUserIcon() {
        if (this.props.loggedUser ) {
            return <div className="ui user label"
                        onClick={this.openPreferencesModal.bind(this)}>{config.userShortName}</div>
        } else {
            return <div className="ui user-nolog label" onClick={this.openLoginModal.bind(this)}>
	                    <i className="icon-user22"/>
                    </div>

        }
    }

    getTeamsSelect() {
        let result = '';
        var self = this;
        if (this.state.teams.size > 0) {
            let items = this.state.teams.map(function(team, i) {
                let iconModal = '';
                if (self.props.showModals) {
                    iconModal = <a className="team-filter button show right"
                                   onClick={(e) => self.openModifyTeam(e, team)}>
                        <i className="icon-more_vert icon"/>
                    </a>
                }
                return <div className="item" data-value={team.get('id')}
                     data-text={team.get('name')}
                     key={'team' + team.get('name') + team.get('id')}
                     onClick={(e) => self.changeTeam(e, team)}>
                    {team.get('name')}
                    {iconModal}
                </div>
            });
            let addTeam = '';
            if (self.props.showModals) {
                addTeam = <div className="header" onClick={this.openCreateTeams.bind(this)}>New Team
                                <a className="team-filter button show">
                                    <i className="icon-plus3 icon"/>
                                </a>
                            </div>
            }
            result = <div className="ui top right pointing dropdown select-org"
                          ref={(dropdownTeams) => this.dropdownTeams = dropdownTeams}>
                <input type="hidden" name="team" className="team-dd" />
                <span className="text">Choose Team</span>
                {/*<i className="dropdown icon"/>*/}
                <div className="menu">
                    {addTeam}
                    { self.props.showModals ? (
                            <div className="divider"></div>
                        ): (
                            ''
                        )}
                    <div className="scrolling menu">
                        {items}
                    </div>
                </div>
            </div>;
        }
        return result;
    }

    render () {
        let self = this;
        let teamsSelect = (this.props.loggedUser) ? this.getTeamsSelect() : '';
        let userIcon = this.getUserIcon();
        let selectedTeam =  this.state.teams.find(function (org) {
            return org.get('id') == self.state.selectedTeamId;
        });
        let subHeader = '';
        let containerClass = "thirteen";
        if (this.props.showSubHeader) {
            subHeader = <div className="ten wide column">
                <SubHeader
                selectedTeam={selectedTeam}
            />
            </div>;
            containerClass = "three";
        }

        return <section className="nav-mc-bar ui grid">

                    <nav className="sixteen wide column navigation">
                        <div className="ui grid">
                            <div className="three wide column">
                                <a href="/" className="logo"/>

                            </div>

                                {subHeader}

                            <div className={containerClass + " wide right floated right aligned column" }>
                                {userIcon}

                                {teamsSelect}

                                { (this.props.showLinks && !this.props.loggedUser) ? (
                                        <ul id="menu-site">
                                            <li><a href="https://www.matecat.com/benefits/">Benefits</a></li>
                                            <li><a href="https://www.matecat.com/outsourcing/">Outsource</a></li>
                                            <li><a href="https://www.matecat.com/support-plans/">Plans</a></li>
                                            <li><a href="https://www.matecat.com/about/">About</a></li>
                                            <li><a href="https://www.matecat.com/faq/">FAQ</a></li>
                                            <li><a href="https://www.matecat.com/support/">Support</a></li>
                                            <li><a className="bigred" href="https://www.matecat.com/webinar" target="_blank">Webinar</a></li>
                                        </ul>

                                    ) : ('')}
                            </div>

                        </div>
                    </nav>
                </section>;
    }
}

Header.defaultProps = {
    showSubHeader: true,
    showModals: true,
    showLinks: false,
    loggedUser: true
};

export default Header ;