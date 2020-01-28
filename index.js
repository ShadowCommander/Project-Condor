const Octokit = require("@octokit/rest");
const octokit = new Octokit()
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
	app.on('issues.labeled', async context => {
		if (!context.payload.repository.has_projects)
			return

		console.log("Test Start")
		try {
		// Get config
		const config = await getConfig(context)
		console.log(config)
		}
		catch(err)
		{
		console.log(err)
		}
		console.log("Test End")
		return

		// Get project from config id
		const project_id = await getProjectId(context, config)
		console.log(project_id)
		return
		if (project_id == null)
			return
		const columns = await getColumns(context, project_id)

		var column_name = null
		column_name = config.labels[context.payload.label.name]
		if (column_name == null)
			return

		const column = getColumn(columns, column_name)
		if (column == null)
		{
			console.log(column_name, columns, column)
			return
		}

		try
		{
			await context.github.projects.createCard({
				column_id: column.id,
				content_id: context.payload.issue.id,
				content_type: 'Issue'
			})
			console.log(`Created card ${card.note} ${card.id} in ${column.name} ${column.id}`)
		}
		catch (err)
		{
			if (err.errors[0].message != 'Project already has the associated issue')
			{
				console.log(err);
				return
			}
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
				console.log(`Moved card ${card.note} ${card.id} from ${col.name} ${col.id} to ${column.name} ${column.id}`)
			}
		}
		catch(err)
		{
			console.log(err)
		}
		/*
		const CONFIG = getConfig(context)
		//context.log(`createCard: ${PAYLOAD.label.name} Issue`)
		const { data } = await GITHUB.projects.listForRepo({ ...context.repo() })
		if (data.length != 1) {
			return;
		}
		*/

		return;
	})

	// For more information on building apps:
	// https://probot.github.io/docs/

	// To get your app running against GitHub, see:
	// https://probot.github.io/docs/development/
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
	if (config.organization)
	{
		const { data } = await context.github.projects.listForOrg({
			'org': config.organization
		})
		projects = data
	}
	else
	{
		const { data } = await context.github.projects.listForRepo({
			...context.repo()
		})
		projects = data
	}

	var project_id = null
	for (const project of projects)
	{
		console.log(project)
		if (project.id == config.project_id)
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
	return await context.config('config.yml', {
		organization: null,
		project_id: null,
		labels: {
			'TODO': 'To Do',
			'To Do': 'To Do',
			'In Progress': 'In Progress',
			'good first issue': 'Good First Issue',
			'Done': 'Done'
		},
		inbox: 'Inbox'
	})
}