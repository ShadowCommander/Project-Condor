/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.on('issues.labeled', async context => {
    const config = await getConfig(context)
    if (!config || !config.labels) {
      console.log('Config broken')
      return
    }

    const data = await createCard(context, config, false)
    if (!data) {
      console.log('Create card failed')
      return
    }
    const { column, columns } = data
    if (!column) {
      console.log('No column')
      return
    }

    try {
      for (const col of columns) {
        if (column.id === col.id) { continue }
        const cards = await getCards(context, col.id)
        if (cards == null) { continue }
        const card = getCard(cards, context.payload.issue.url)
        if (card == null) { continue }

        await context.github.projects.moveCard({
          card_id: card.id,
          position: 'top',
          column_id: column.id
        })
        console.log(`Moved card ${card.id} from '${col.name}' ${col.id} to '${column.name}' ${column.id}`)
      }
    } catch (err) {
      console.log(err)
    }
  })
  app.on('issues.opened', async context => {
    const config = await getConfig(context)
    if (!config) {
      console.log('Config broken')
      return
    }

    if (!config.inbox) {
      return
    }

    const column = await createCard(context, config, true)
    if (!column) {
      console.log('Create card failed')
    }
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}

async function createCard (context, config, toInbox) {
  var columnName = null
  if (toInbox) { columnName = config.inbox } else { columnName = config.labels[context.payload.label.name] }
  if (columnName == null) {
    console.log(`No column_name ${context.payload.label.name} in config`)
    return null
  }

  // Get project from config id
  const projectId = await getProjectId(context, config)
  if (projectId == null) {
    console.log('No project_id')
    return null
  }
  const columns = await getColumns(context, projectId)

  const column = getColumn(columns, columnName)
  if (column == null) {
    console.log('No column', columnName, columns, column)
    return null
  }

  try {
    await context.github.projects.createCard({
      column_id: column.id,
      content_id: context.payload.issue.id,
      content_type: 'Issue'
    }).then(({
      data: card
    }) => {
      console.log(`Created card ${card.id} in ${column.name} ${column.id}`)
    })
  } catch (err) {
    if (err.errors[0].message !== 'Project already has the associated issue') {
      console.log(err)
      return null
    }
  }
  console.log('Card exists')
  return { column, columns }
}

async function getCards (context, columnId) {
  const {
    data
  } = await context.github.projects.listCards({
    column_id: columnId
  })
  return data
}

function getCard (cards, issueUrl) {
  for (const card of cards) {
    if (card.content_url === issueUrl) { return card }
  }
  return null
}

async function getProjectId (context, config) {
  var projects = null
  if (config.org) {
    const { data } = await context.github.projects.listForOrg({
      org: config.org
    }).catch(console.log)
    projects = data
  } else {
    const { data } = await context.github.projects.listForRepo({ ...context.repo() })
      .catch(console.log)
    projects = data
  }

  if (!projects) { return }

  if (!config.project) {
    if (projects[0]) { return projects[0].id } else { return null }
  }

  var projectId = null
  for (const project of projects) {
    if (project.number === config.project) {
      projectId = project.id
      break
    }
  }
  return projectId
}

async function getColumns (context, projectId) {
  const {
    data
  } = await context.github.projects.listColumns({
    project_id: projectId
  })
  return data
}

function getColumn (columns, columnName) {
  for (const column of columns) {
    if (column.name === columnName) { return column }
  }
  return null
}

async function getConfig (context) {
  const config = await context.config('config.yml', {
    'Project-Condor': {
      inbox: 'Inbox',
      labels: {
        'To Do': 'To Do',
        'In progress': 'In progress',
        Done: 'Done'
      }
    }
  })
  return config['Project-Condor']
}
