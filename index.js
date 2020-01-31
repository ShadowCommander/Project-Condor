const Octokit = require("@octokit/rest");
const octokit = new Octokit()
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

		try
		{
			for (const col of columns)
			{
				if (column.id == col.id)
					continue
				const cards = await getCards(context, col.id)
				if (cards == null)
					continue
				const card = getCard(cards, context.payload.issue.url)
				if (card == null)
					continue

				await context.github.projects.moveCard({
					card_id: card.id,
					position: 'top',
					column_id: column.id
				})
				console.log(`Moved card ${card.id} from '${col.name}' ${col.id} to '${column.name}' ${column.id}`)
			}
		}
		catch(err)
		{
			console.log(err)
		}
		return;
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
			return
		}
	})

	// For more information on building apps:
	// https://probot.github.io/docs/

	// To get your app running against GitHub, see:
	// https://probot.github.io/docs/development/
}

async function createCard(context, config, toInbox)
{
	var column_name = null
	if (toInbox)
		column_name = config.inbox
	else
		column_name = config.labels[context.payload.label.name]
	if (column_name == null) {
		console.log(`No column_name ${context.payload.label.name} in config`)
		return null
	}

	// Get project from config id
	const project_id = await getProjectId(context, config)
	if (project_id == null) {
		console.log('No project_id')
		return null
	}
	const columns = await getColumns(context, project_id)

	const column = getColumn(columns, column_name)
	if (column == null)
	{
		console.log('No column', column_name, columns, column)
		return null
	}

	try
	{
		await context.github.projects.createCard({
			column_id: column.id,
			content_id: context.payload.issue.id,
			content_type: 'Issue'
		}).then(({ data: card }) => {
			console.log(`Created card ${card.id} in ${column.name} ${column.id}`)
		})
	}
	catch(err)
	{
		if (err.errors[0].message != 'Project already has the associated issue')
		{
			console.log(err);
			return null
		}
	}
	console.log("Card exists")
	return { column, columns }
}


async function getCards(context, column_id)
{
	const { data } = await context.github.projects.listCards({
		column_id: column_id
	})
	return data
}

function getCard(cards, issue_url)
{
	for (const card of cards)
	{
		if (card.content_url == issue_url)
			return card
	}
	return null
}

async function getProjectId(context, config)
{
	var projects;
	if (config.org)
	{
		const { data } = await context.github.projects.listForOrg({
			'org': config.org
		}).catch(console.log)
		projects = data
	}
	else
	{
		const { data } = await context.github.projects.listForRepo({
			...context.repo()
		}).catch(console.log)
		projects = data
	}

	if (!config.project) {
		if (projects[0])
			return projects[0].id
		else
			return null
	}

	var project_id = null
	for (const project of projects)
	{
		if (project.number == config.project)
		{
			project_id = project.id
			break
		}
	}
	return project_id
}

async function getColumns(context, project_id)
{
	const { data } = await context.github.projects.listColumns({
		project_id: project_id
	})
	return data
}

function getColumn(columns, column_name)
{
	for (const column of columns)
	{
		if (column.name == column_name)
			return column;
	}
	return null
}

async function getConfig(context) {
	const config = await context.config('config.yml', {
		'Project-Manager': {
			inbox: 'Inbox',
			labels: {
				'To Do': 'To Do',
				'In progress': 'In progress',
				'Done': 'Done'
			}
		}
	})
	return config['Project-Manager']
}