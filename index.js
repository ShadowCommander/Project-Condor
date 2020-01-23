const Octokit = require("@octokit/rest");
const octokit = new Octokit()
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
	const storedCards = [];

	
	octokit.repos.get({
		owner: app.owner,
		mediaType: {
			previews: ["starfox-preview"]
		}
	})
	console.log(app.Octokit.plugin)
	//for (var p in app.Octokit)
		//console.log(`"${p}": `, app.Octokit[p])
	return;
	app.on('issues.labeled', async context => {
		const config = {
			project_number: 1,
			labels: [
				{label: 'TODO', column: 'To Do'},
				{label: 'In Progress', column: 'In Progress'},
			]
		}
		context.log(context.payload)
		return;
		if (!context.payload.repository.has_projects)
			return
		
		const project_id = await getRepos(context, config)
		if (project_id == null)
			return
		const columns = await getColumns(context, project_id)

		var column = null
		for (const label of config.labels)
		{
			if (label.label == context.payload.label.name)
			{
				column = label.column
				break
			}
		}
		if (column == null)
			return;

		for (const col of columns)
		{
			if (col.name == column)
			{
				try
				{
					await context.github.projects.createCard({
						column_id: col.id,
						content_id: context.payload.issue.id,
						content_type: 'Issue'
					})
				}
				catch (err)
				{
					/*
					if (err.errors[0].message == 'Project already has the associated issue')
					{
						const cards = getCards(context, col.id)
						context.log(cards)
						await context.github.projects.moveCard({

						})
					}
					*/
					/*
					context.log(`ERORR ERROR ERROR`);
					context.log(err)
					for (const e in err)
						context.log(`"${e}":`, err[e])
						*/
				}
				break;
			}
		}
		/*
		const CONFIG = getConfig(context)
		//context.log(`createCard: ${PAYLOAD.label.name} Issue`)
		const { data } = await GITHUB.projects.listForRepo({ ...context.repo() })
		if (data.length != 1) {
			return;
		}

		const project_id = data[0].id
		context.log(`project_id ${project_id}`);
		
		for (var label of CONFIG.labels) {
			if (PAYLOAD.label.name == label.label) {
				try {
					await GITHUB.projects.createCard({
						column_id: label.list,
						content_id: PAYLOAD.id,
						content_type: 'Issue'
					})
					break;
				} catch (err) {
					context.log(err, err.request);
				}
			}
		}
		
		*/
		return;
	})
	app.on('project_card.created', async context => {
		context.log(`Card created: ${context.payload.project_card.note}`)
	})

	// For more information on building apps:
	// https://probot.github.io/docs/

	// To get your app running against GitHub, see:
	// https://probot.github.io/docs/development/
}

async function forRepository() {

}

async function getCards(context, column_id)
{
	const { data } = await context.github.projects.listCards({
		column_id: column_id
	})
	return data
}

async function getRepos(context, config)
{
	const { data } = await context.github.projects.listForRepo({ ...context.repo() })
	var project_id = null
	for (const proj of data)
	{
		if (proj.number == config.project_number)
		{
			project_id = proj.id
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
async function listForRepo()
{
	var data = { data: [ { owner_url:
       'https://api.github.com/repos/ShadowCommander/Project-Manager',
      url: 'https://api.github.com/projects/3732336',
      html_url:
       'https://github.com/ShadowCommander/Project-Manager/projects/1',
      columns_url: 'https://api.github.com/projects/3732336/columns',
      id: 3732336,
      node_id: 'MDc6UHJvamVjdDM3MzIzMzY=',
      name: 'Test',
      body: '',
      number: 1,
      state: 'open',
      creator:
       { login: 'ShadowCommander',
         id: 10494922,
         node_id: 'MDQ6VXNlcjEwNDk0OTIy',
         avatar_url: 'https://avatars0.githubusercontent.com/u/10494922?v=4',
         gravatar_id: '',
         url: 'https://api.github.com/users/ShadowCommander',
         html_url: 'https://github.com/ShadowCommander',
         followers_url: 'https://api.github.com/users/ShadowCommander/followers',
         following_url:
          'https://api.github.com/users/ShadowCommander/following{/other_user}',
         gists_url:
          'https://api.github.com/users/ShadowCommander/gists{/gist_id}',
         starred_url:
          'https://api.github.com/users/ShadowCommander/starred{/owner}{/repo}',
         subscriptions_url: 'https://api.github.com/users/ShadowCommander/subscriptions',
         organizations_url: 'https://api.github.com/users/ShadowCommander/orgs',
         repos_url: 'https://api.github.com/users/ShadowCommander/repos',
         events_url:
          'https://api.github.com/users/ShadowCommander/events{/privacy}',
         received_events_url:
          'https://api.github.com/users/ShadowCommander/received_events',
         type: 'User',
         site_admin: false },
      created_at: '2019-12-28T23:47:21Z',
      updated_at: '2019-12-29T01:08:09Z' } ] }
	return data
}

async function getConfig(context) {
	return context.config('project-manager.yml', {
		project: context.project,
		labels: [{label: 'Done', list:'Done'},
		{label: 'In progress', list: 'In Progress'},
		{label: 'TODO', list: 'TODO'},
		{label: null, list: 'Inbox'}
	]
	})
}

/*
Planning

Use projects.number to determine which project to add to
*/