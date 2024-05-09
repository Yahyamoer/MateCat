import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import Immutable from 'immutable'
import {http, HttpResponse} from 'msw'

import TeamsSelect from './TeamsSelect'
import UserActions from '../../actions/UserActions'
import ModalsActions from '../../actions/ModalsActions'
import UserStore from '../../stores/UserStore'
import UserConstants from '../../constants/UserConstants'
import ManageConstants from '../../constants/ManageConstants'
import {mswServer} from '../../../../../mocks/mswServer'
let modalVisible = false
beforeAll(() => {
  ModalsActions.openCreateTeamModal = () => {
    modalVisible = true
  }
})

afterEach(() => {
  modalVisible = false
})
window.config = {
  isLoggedIn: 1,
  basepath: '/',
  hostpath: 'https://dev.matecat.com',
}

const fakeTeamsData = {
  threeTeams: {
    data: JSON.parse(
      '[{"id":1,"name":"Personal","type":"personal","created_at":"2021-06-23T12:51:48+02:00","created_by":1,"members":[{"id":1,"id_team":1,"user":{"uid":1,"first_name":"Pierluigi","last_name":"Di Cianni","email":"pierluigi.dicianni@translated.net","has_password":false},"user_metadata":{"gplus_picture":"https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c"},"projects":14}],"pending_invitations":[]},{"id":2,"name":"Test","type":"general","created_at":"2021-07-05T15:40:56+02:00","created_by":1,"members":[{"id":2,"id_team":2,"user":{"uid":1,"first_name":"Pierluigi","last_name":"Di Cianni","email":"pierluigi.dicianni@translated.net","has_password":false},"user_metadata":{"gplus_picture":"https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c"},"projects":1}],"pending_invitations":[]},{"id":4,"name":"Pie","type":"general","created_at":"2021-07-15T15:26:10+02:00","created_by":1,"members":[{"id":4,"id_team":4,"user":{"uid":1,"first_name":"Pierluigi","last_name":"Di Cianni","email":"pierluigi.dicianni@translated.net","has_password":false},"user_metadata":{"gplus_picture":"https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c"},"projects":0}],"pending_invitations":[]}]',
    ),
    props: {
      changeTeam: true,
      isManage: true,
      loggedUser: true,
      selectedTeamId: 1,
      showModals: true,
      showTeams: true,
    },
  },
}

const getFakeProperties = (fakeProperties) => {
  const {data, props} = fakeProperties
  const teams = Immutable.fromJS(data)

  return {
    teams,
    props: {
      ...props,
      teams,
    },
  }
}

const apiUserMockResponse = {
  user: {
    uid: 1,
    first_name: 'Pierluigi',
    last_name: 'Di Cianni',
    email: 'pierluigi.dicianni@translated.net',
    has_password: false,
  },
  connected_services: [],
  metadata: {
    gplus_picture:
      'https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c',
  },
  teams: [
    {
      id: 1,
      name: 'Personal',
      type: 'personal',
      created_at: '2021-06-23T12:51:48+02:00',
      created_by: 1,
      members: [
        {
          id: 1,
          id_team: 1,
          user: {
            uid: 1,
            first_name: 'Pierluigi',
            last_name: 'Di Cianni',
            email: 'pierluigi.dicianni@translated.net',
            has_password: false,
          },
          user_metadata: {
            gplus_picture:
              'https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c',
          },
          projects: 14,
        },
      ],
      pending_invitations: [],
    },
    {
      id: 2,
      name: 'Test',
      type: 'general',
      created_at: '2021-07-05T15:40:56+02:00',
      created_by: 1,
      members: [
        {
          id: 2,
          id_team: 2,
          user: {
            uid: 1,
            first_name: 'Pierluigi',
            last_name: 'Di Cianni',
            email: 'pierluigi.dicianni@translated.net',
            has_password: false,
          },
          user_metadata: {
            gplus_picture:
              'https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c',
          },
          projects: 1,
        },
      ],
      pending_invitations: ['federico@translated.net'],
    },
    {
      id: 4,
      name: 'Pie',
      type: 'general',
      created_at: '2021-07-15T15:26:10+02:00',
      created_by: 1,
      members: [
        {
          id: 4,
          id_team: 4,
          user: {
            uid: 1,
            first_name: 'Pierluigi',
            last_name: 'Di Cianni',
            email: 'pierluigi.dicianni@translated.net',
            has_password: false,
          },
          user_metadata: {
            gplus_picture:
              'https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c',
          },
          projects: 0,
        },
      ],
      pending_invitations: [],
    },
  ],
}

const apiTeamsMembersMockResponse = {
  members: [
    {
      id: 2,
      id_team: 2,
      user: {
        uid: 1,
        first_name: 'Pierluigi',
        last_name: 'Di Cianni',
        email: 'pierluigi.dicianni@translated.net',
        has_password: false,
      },
      user_metadata: {
        gplus_picture:
          'https://lh3.googleusercontent.com/a/AATXAJwhJzx7La8Z9rRvEuounsMpkH7TIwsOGT_a_xOb=s96-c',
      },
      projects: 1,
    },
  ],
  pending_invitations: [],
}

const executeMswServer = () => {
  mswServer.use(
    ...[
      http.get('/api/app/user', () => {
        return HttpResponse.json(apiUserMockResponse)
      }),
      http.get('/api/v2/teams/2/members', () => {
        return HttpResponse.json(apiTeamsMembersMockResponse)
      }),
    ],
  )
}

beforeAll(() => {
  ModalsActions.openCreateTeamModal = () => {}
})

test('Rendering elements', () => {
  const {props} = getFakeProperties(fakeTeamsData.threeTeams)
  render(<TeamsSelect {...props} />)

  expect(screen.getByText('Create New Team')).toBeInTheDocument()
  expect(screen.getByText('Personal')).toBeInTheDocument()
  expect(screen.getByText('Test')).toBeInTheDocument()
  expect(screen.getByText('Pie')).toBeInTheDocument()
})

xtest('Click create new team check flow', async () => {
  executeMswServer()
  const {props} = getFakeProperties(fakeTeamsData.threeTeams)
  render(<TeamsSelect {...props} />)

  userEvent.click(screen.getByText('Create New Team'))

  expect(modalVisible).toBeTruthy()
})

xtest('Click on change team', async () => {
  executeMswServer()

  // set teams state
  UserActions.renderTeams(apiUserMockResponse.teams)

  const {props} = getFakeProperties(fakeTeamsData.threeTeams)
  render(<TeamsSelect {...props} />)

  const defaultScrollTo = window.scrollTo
  window.scrollTo = () => {}

  let teamSelected
  UserStore.addListener(
    UserConstants.UPDATE_TEAM,
    (team) => (teamSelected = team.get('name')),
  )

  await waitFor(() => {
    expect(teamSelected).toBe('Test')
  })

  window.scrollTo = defaultScrollTo
})

xtest('Click on team settings', async () => {
  executeMswServer()
  let test = false
  const {props} = getFakeProperties(fakeTeamsData.threeTeams)
  render(<TeamsSelect {...props} />)

  UserStore.addListener(
    ManageConstants.OPEN_MODIFY_TEAM_MODAL,
    () => (test = true),
  )

  userEvent.click(screen.getByTestId('team-setting-icon-Test'))
  expect(test).toBeTruthy()
})
