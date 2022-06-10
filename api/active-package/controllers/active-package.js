'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
	async find(ctx) {
		const user = ctx.state.user;
		if (!user) {
			return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
		}

		// Unfortunately Strapi can't find nested objects, so we will not get the location (townships - field) of the nested package property
		const data = await strapi.services['active-package'].find({ profile: user.profile });
		if (!data) {
			return ctx.notFound();
		}

		// This "packageId" parameter will be used in the following case:
		// If we would like to check, if there is a default package present in active-packages
		let { packageId } = ctx.request.query;
		packageId = parseInt(packageId);
		if (packageId && !isNaN(packageId)) {
			const newData = data.find((item) => item.package.id == packageId);
			if (newData) {
				newData.package = (await strapi.services.packages.find({ id: newData.package.id }))[0];

				ctx.send(newData);
			} else {
				ctx.notFound();
			}
		} else {
			// So we have to manually GET them from /packages endpoint... :(
			const newData = await Promise.all(
				data.map(async (item) => ({
					id: item.id,
					package: (await strapi.services.packages.find({ id: item.package.id }))[0],
					fields: item.fields,
					conditions: (await strapi.services.conditions.find({ active_package: item.id })).map(({ id, active_package, content, startDate, endDate, finished }) => ({ id, active_package, content, startDate, endDate, finished })),
				}))
			);

			ctx.send(newData);
		}
  },

  async findOne(ctx) {
	const user = ctx.state.user;

	if (!user) {
		return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
	}

	const data = await strapi.services['active-package'].find({ profile: user.profile });
	if (!data) {
		return ctx.notFound();
	}

	const { id } = ctx.params;
	const newData = data.filter((item) => item.id === parseInt(id))[0];
	if (!newData) {
		return ctx.notFound();
	}

	// Unfortunately Strapi can't find nested objects, so we will not get the location (townships - field) of the nested package property
	// So we have to manually GET them from /packages endpoint... :(
	newData.package = (await strapi.services.packages.find({ id: newData.package.id }))[0];

	return newData;
  },

  async create(ctx) {
	const user = ctx.state.user;
	if (!user) {
		return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
	}

	const { body } = ctx.request;
	const { id } = body;

	const myPackage = await strapi.services['planned-package'].find({ id });
	if (!myPackage || !myPackage.length) {
		return ctx.notFound();
	}

	// Check if user already has active package with this package
	const activeData = await strapi.services['active-package'].find({ profile: user.profile });
	if (activeData && activeData.length) {
		const newActiveData = activeData.filter((item) => item.package.id === myPackage[0].package.id);
		if (newActiveData && newActiveData.length) {
			return ctx.badRequest(null, [{ messages: [{ id: 'Already have active package with this package.' }] }]);
		}
	}

	// The original package
	const searchedPackage = myPackage[0].package;
	// Get the successfully created active package
	const activePackageAdded = await strapi.services['active-package'].create({
		package: searchedPackage,
		fields: [],
		profile: user.profile,
	});

	// Add conditions
	const { conditions } = searchedPackage;
	for (const item of conditions) {
		const { name, startDate, endDate } = item;
		await strapi.services.conditions.create({
			content: name,
			active_package: activePackageAdded,
			profile: user.profile,
			startDate,
			endDate,
		});
	}

	return activePackageAdded;
  },

  async delete(ctx) {
	const user = ctx.state.user;
	if (!user) {
		return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
	}

	const activePackage = await strapi.services['active-package'].findOne({ profile: user.profile });

	if (!activePackage) {
		return ctx.notFound();
	} else {
		if (activePackage.profile.id === user.profile) {
			const { id } = ctx.params;
			return await strapi.services['active-package'].delete({ id });
		}
	}
  }
};
