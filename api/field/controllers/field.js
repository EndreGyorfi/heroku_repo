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

		const data = await strapi.services['field'].find({ profile: user.profile });  
    if (!data) {
      return ctx.badRequest();
		}


    const { fieldId } = ctx.request.query;
    if (fieldId) {
      const newData = data.find((item) => item.field.id == fieldId);
      if (newData) {
        newData.field = (await strapi.services.fields.find({ id: newData.field.id }))[0];

        ctx.send(newData);
      } else {
        ctx.notFound();
      }
    } else {
      const newData = await Promise.all(
        data.map(async (item) => ({
          id: item.id,
          name: item.name,
          size: item.size,
          unit_type: item.unit_type,
          field_type: item.field_type,
          cultivated_plant: item.cultivated_plant,
          profile: user
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

	    const data = await strapi.services['field'].find({ profile: user.profile });
	    if (!data) {
		    return ctx.notFound();
	    }
	
	    const { id } = ctx.params;
	    const newData = data.filter((item) => item.id === parseInt(id))[0];
	    if (!newData) {
		    return ctx.notFound();
	}
	

	return newData;
  },
  
  async create(ctx) {
	const user = ctx.state.user;
	if (!user) {
		return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
	}


  const { name, size, unit_type, field_type, cultivated_plant } = ctx.request.body;
	
    return await strapi.services['field'].create({
      name,
      size,
      unit_type,
      field_type,
      cultivated_plant,
      profile: user.profile,
	});
  },

  async delete(ctx) {
	const user = ctx.state.user;
	if (!user) {
		return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
	}

	const delField = await strapi.services['field'].findOne({ profile: user.profile });

	if (!delField) {
		return ctx.notFound();
	} else {
		if (delField.profile.id === user.profile) {
			const { id } = ctx.params;
			return await strapi.services['field'].delete({ id });
		}
	}
  }
};
