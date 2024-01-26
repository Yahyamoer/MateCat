import React, {useEffect, useRef} from 'react'
import {render, renderHook, waitFor, screen, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import useProjectTemplates from '../../hooks/useProjectTemplates'
import {ProjectTemplate} from './ProjectTemplate'
import {SettingsPanelContext} from './SettingsPanelContext'
import {mswServer} from '../../../../../mocks/mswServer'
import {HttpResponse, http} from 'msw'
import projectTemplatesMock from '../../../../../mocks/projectTemplateMock'

global.config = {
  basepath: 'http://localhost/',
  enableMultiDomainApi: false,
  ajaxDomainsNumber: 20,
}

const wrapperElement = document.createElement('div')
const WrapperComponent = (contextProps) => {
  const ref = useRef()

  useEffect(() => {
    ref.current.appendChild(wrapperElement)
  }, [])

  return (
    <SettingsPanelContext.Provider
      value={{...contextProps, wrapperRef: {current: wrapperElement}}}
    >
      <div ref={ref}>
        <ProjectTemplate />
      </div>
    </SettingsPanelContext.Provider>
  )
}

beforeEach(() => {
  mswServer.use(
    http.get(`${config.basepath}api/v3/project-template/`, () => {
      return HttpResponse.json(projectTemplatesMock)
    }),
  )
})

test('Render properly', async () => {
  const user = userEvent.setup()

  const {result} = renderHook(() => useProjectTemplates(true))

  await waitFor(() => {
    expect(result.current.projectTemplates?.length).toBe(2)
  })

  let {projectTemplates, setProjectTemplates, currentProjectTemplate} =
    result.current

  const {rerender} = render(
    <WrapperComponent
      {...{projectTemplates, setProjectTemplates, currentProjectTemplate}}
    />,
  )

  const selectLabel = screen.getByText('Standard')
  expect(selectLabel).toBeInTheDocument()

  await act(async () => user.click(selectLabel))

  const itemTestingTemplate = screen.getByText('Testing template')
  expect(itemTestingTemplate).toBeInTheDocument()

  await act(async () => user.click(itemTestingTemplate))

  projectTemplates = result.current.projectTemplates
  currentProjectTemplate = result.current.currentProjectTemplate
  rerender(
    <WrapperComponent
      {...{projectTemplates, setProjectTemplates, currentProjectTemplate}}
    />,
  )

  expect(projectTemplates.find(({isSelected}) => isSelected).id).toBe(3)
  expect(result.current.currentProjectTemplate.id).toBe(3)
})

test('Create and delete template', async () => {
  const user = userEvent.setup()

  const {result} = renderHook(() => useProjectTemplates(true))
  const {modifyingCurrentTemplate} = result.current

  await waitFor(() => {
    expect(result.current.projectTemplates?.length).toBe(2)
  })

  mswServer.use(
    ...[
      http.post(`${config.basepath}api/v3/project-template/`, () => {
        return HttpResponse.json({
          id: 4,
          name: 'my template',
          uid: 54,
          is_default: true,
          id_team: 45,
          qa_template_id: 4456,
          payable_rate_template_id: 434,
          speech2text: true,
          lexica: true,
          tag_projection: true,
          cross_language_matches: ['it-IT', 'fr-FR'],
          segmentation_rule: 'General',
          mt: {
            id: 9,
            extra: {},
          },
          tm: [],
          get_public_matches: true,
          pretranslate_100: true,
        })
      }),
      http.delete(`${config.basepath}api/v3/project-template/:id`, () => {
        return HttpResponse.json({
          id: 4,
        })
      }),
    ],
  )

  let {projectTemplates, setProjectTemplates, currentProjectTemplate} =
    result.current

  const {rerender} = render(
    <WrapperComponent
      {...{projectTemplates, setProjectTemplates, currentProjectTemplate}}
    />,
  )

  expect(screen.getByText('Standard')).toBeInTheDocument()

  act(() => {
    modifyingCurrentTemplate((prevTemplate) => ({
      ...prevTemplate,
      [result.current.availableTemplateProps.pretranslate100]: true,
    }))
  })

  projectTemplates = result.current.projectTemplates
  rerender(
    <WrapperComponent
      {...{projectTemplates, setProjectTemplates, currentProjectTemplate}}
    />,
  )

  const buttonCreate = screen.getByTestId('save-as-new-template')
  expect(buttonCreate).toBeInTheDocument()

  await act(async () => user.click(buttonCreate))

  const input = screen.getByTestId('template-name-input')
  expect(input).toHaveFocus()

  await act(async () => user.type(input, 'my template'))
  await act(async () => user.click(screen.getByTestId('create-template')))

  expect(result.current.currentProjectTemplate.id).toBe(4)

  projectTemplates = result.current.projectTemplates
  currentProjectTemplate = result.current.currentProjectTemplate
  rerender(
    <WrapperComponent
      {...{projectTemplates, setProjectTemplates, currentProjectTemplate}}
    />,
  )

  expect(screen.getByText('my template')).toBeInTheDocument()

  // delete
  await act(async () =>
    user.click(screen.getByTestId('menu-button-show-items')),
  )

  await act(async () => user.click(screen.getByTestId('delete-template')))

  expect(result.current.currentProjectTemplate.id).toBe(0)

  projectTemplates = result.current.projectTemplates
  currentProjectTemplate = result.current.currentProjectTemplate
  rerender(
    <WrapperComponent
      {...{projectTemplates, setProjectTemplates, currentProjectTemplate}}
    />,
  )

  expect(screen.getByText('Standard')).toBeInTheDocument()
})
