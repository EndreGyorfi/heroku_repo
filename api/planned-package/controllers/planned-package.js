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
		const data = await strapi.services['planned-package'].find({ profile: user.profile });
		if (!data) {
			return ctx.notFound();
		}

		// This "packageId" parameter will be used in the following case:
		// If we would like to check, if there is a default package present in planned-packages
		let { packageId } = ctx.request.query;
		packageId = parseInt(packageId);
		if (packageId && !isNaN(packageId)) {
			const newData = data.find((item) => item.package.id === packageId);
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
					preconditions: (await strapi.services.preconditions.find({ planned_package: item.id })).map(({ id, content, finished }) => ({ id, content, finished })),
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

	const data = await strapi.services['planned-package'].find({ profile: user.profile });
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
	newData.preconditions = (await strapi.services.preconditions.find({ planned_package: id })).map(({ id, content, finished }) => ({ id, content, finished }));

	return newData;
  },

  async create(ctx) {
	const user = ctx.state.user;
	if (!user) {
		return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
	}

	const { body } = ctx.request;
	const { id } = body;


	const myPackage = await strapi.services.packages.find({ id });
	if (!myPackage || !myPackage.length) {
		return ctx.notFound();
	}

	// Check if user already has planned package with this package
	const plannedData = await strapi.services['planned-package'].find({ profile: user.profile });
	if (plannedData && plannedData.length) {
		const newPlannedData = plannedData.filter((item) => item.package.id === id);
		if (newPlannedData && newPlannedData.length) {
			return ctx.badRequest(null, [{ messages: [{ id: 'Already have planned package with this package.' }] }]);
		}
	}

  // The original package
  const searchedPackage = myPackage[0];
  // Get the successfully created planned package
  const plannedPackageAdded = await strapi.services['planned-package'].create({
    package: searchedPackage,
    fields: [],
    profile: user.profile,
  });

  // Add preconditions
  const { preconditions } = searchedPackage;
  for (const item of preconditions) {
    const { name } = item;
    await strapi.services.preconditions.create({
      content: name,
      planned_package: plannedPackageAdded,
      profile: user.profile,
    });
  }

    return plannedPackageAdded;
  },

  async delete(ctx) {
	const user = ctx.state.user;
	if (!user) {
		return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
	}

	const plannerPackage = await strapi.services['planned-package'].findOne({ profile: user.profile });

	if (!plannerPackage) {
		return ctx.notFound();
	} else {
		if (plannerPackage.profile.id === user.profile) {
			const { id } = ctx.params;

      // IDK how to do cascade delete here
      // await strapi.services.preconditions.delete({ planned_package: { id } });
			return await strapi.services['planned-package'].delete({ id });
		}
	}
  }
};
