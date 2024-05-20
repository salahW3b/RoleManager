const { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
  } = require('discord.js');
  
  module.exports = {
      name: "Modification Des Roles",
      type: 2, 
      toJSON() {
        return this;
      },
      go: async (client, db, config, interaction, args) => {
  
        if (!db.get(`Owner_${interaction.guild.id}-${interaction.user.id}`) && !config.owners.includes(interaction.user.id) && interaction.user.id !== interaction.guild.ownerId) return interaction.reply({ content: `\`❌\` *Vous n'avez pas les permission pour executé cette commande*`, ephemeral: true })

        
        let member = await interaction.guild.members.fetch(interaction.targetId);
        const pageSize = 6;
        let currentIndex = 0;
        
        let embed = new EmbedBuilder()
          .setTitle("Modificateur de rôles d'un membre")
          .setDescription(
            `\`\`\`Information du membre\`\`\`\n${member} (\`${member.id}\`)\n\n` +
            `\`\`\`Rôles actuels\`\`\`\n${member.roles.cache.map((role) => `${role} (\`${role.id}\`)`).join("\n") || "Aucun rôle"}`
          )
          .setColor("2F3136")
          .setFooter({ text: `Page ${Math.ceil(currentIndex / pageSize) + 1}/${Math.ceil(interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size / pageSize)}` });
  
        if (interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size === 0) {
          return interaction.reply({ content: `Le serveur n'a aucun rôle`, ephemeral: true });
        }
  
        let number = Math.random() * 100;
        let rowOfButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId("button3" + number).setLabel("Retour").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("button2" + number).setLabel("Suivant").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("button1" + number).setLabel("DERANK").setStyle(ButtonStyle.Danger)
          );
  
        let rowOfSelectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("select" + number)
            .setMaxValues(6)
            .setMinValues(0)
            .setPlaceholder("Sélectionne un rôle")
            .addOptions(
              interaction.guild.roles.cache
                .filter(r => !r.managed && r.name !== "@everyone")
                .sort((a, b) => a.position - b.position)
                .map(role => new StringSelectMenuOptionBuilder()
                  .setLabel(role.name)
                  .setValue(role.id)
                )
                .slice(currentIndex, currentIndex + 6)
            )
        );
  
        rowOfSelectMenu.components[0].options.forEach(option => {
          if (member.roles.cache.has(option.data.value)) option.setDefault(true);
        });
  
        await interaction.reply({ content: "Chargement", ephemeral: false });
        update(interaction);
  
        async function update(i) {
          rowOfSelectMenu.components[0].options = interaction.guild.roles.cache
            .filter(r => !r.managed && r.name !== "@everyone")
            .sort((a, b) => a.position - b.position)
            .map(role => new StringSelectMenuOptionBuilder()
              .setLabel(role.name)
              .setValue(role.id)
            )
            .slice(currentIndex, currentIndex + 6);
  
          member = await interaction.guild.members.fetch(member.id);
          rowOfSelectMenu.components[0].options.forEach(option => {
            if (member.roles.cache.has(option.data.value)) option.setDefault(true);
          });
  
          rowOfSelectMenu.components[0].maxValues = rowOfSelectMenu.components[0].options.length;
          rowOfButtons.components[0].setDisabled(currentIndex <= 0);
  
          i.editReply({
            content: null,
            ephemeral: false,
            embeds: [embed],
            components: [rowOfSelectMenu, rowOfButtons],
          });
        }
  
        const collector = interaction.channel.createMessageComponentCollector({ componentType: 3, time: 60000 });
        const collector2 = interaction.channel.createMessageComponentCollector({ componentType: 2, time: 60000 });
  
        collector2.on("collect", async i => {
          await i.deferUpdate();
          if (i.customId === "button1" + number) {
            const rolesToRemove = member.roles.cache.filter(r => r.position < interaction.member.roles.highest.position);
            await Promise.all(rolesToRemove.map(r => member.roles.remove(r).catch(console.error))).then(() => {
              embed.setFooter ({text: `Page ${Math.ceil(currentIndex / pageSize) + 1}/${Math.ceil(interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size / pageSize)}`});
              embed.setDescription(`\`\`\`Information du membre\`\`\`\n${member} (\`${member.id}\`)\n\n` +
                `\`\`\`Rôles actuels\`\`\`\n${member.roles.cache.map(role => `${role} (\`${role.id}\`)`).join("\n") || "Aucun rôle"}`);
              update(interaction);
            });
          }
          if (i.customId === "button2" + number) {
            currentIndex += 6;
            if (currentIndex > interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size - 1) currentIndex = 0;
            rowOfSelectMenu.components[0].options = interaction.guild.roles.cache
              .filter(r => !r.managed && r.name !== "@everyone")
              .map(role => new StringSelectMenuOptionBuilder()
                .setLabel(role.name)
                .setValue(role.id)
              )
              .slice(currentIndex, currentIndex + 6)
              .map(option => {
                if (member.roles.cache.has(option.data.value)) option.setDefault(true);
                return option;
              });
            rowOfButtons.components[0].setDisabled(currentIndex <= 0);
            embed.setDescription(`\`\`\`Information du membre\`\`\`\n${member} (\`${member.id}\`)\n\n` +
              `\`\`\`Rôles actuels\`\`\`\n${member.roles.cache.map(role => `${role} (\`${role.id}\`)`).join("\n") || "Aucun rôle"}`);
            embed.setFooter({ text: `Page ${Math.ceil(currentIndex / pageSize) + 1}/${Math.ceil(interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size / pageSize)}` });
            update(i);
          }
          if (i.customId === "button3" + number) {
            currentIndex -= 6;
            if (currentIndex < 0) currentIndex = interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size - (interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size % 6);
            rowOfSelectMenu.components[0].options = interaction.guild.roles.cache
              .filter(r => !r.managed && r.name !== "@everyone")
              .map(role => new StringSelectMenuOptionBuilder()
                .setLabel(role.name)
                .setValue(role.id)
              )
              .slice(currentIndex, currentIndex + 6)
              .map(option => {
                if (member.roles.cache.has(option.data.value)) option.setDefault(true);
                return option;
              });
            rowOfButtons.components[0].setDisabled(currentIndex <= 0);
            embed.setDescription(`\`\`\`Information du membre\`\`\`\n${member} (\`${member.id}\`)\n\n` +
              `\`\`\`Rôles actuels\`\`\`\n${member.roles.cache.map(role => `${role} (\`${role.id}\`)`).join("\n") || "Aucun rôle"}`);
            embed.setFooter({text: `Page ${Math.ceil(currentIndex / pageSize) + 1}/${Math.ceil(interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").size / pageSize)}`});
            update(i);
          }
        });
  
        collector.on("collect", async i => {
          if (i.customId === "select" + number) {
            await i.deferUpdate();
            const newOptions = i.values;
            const oldOptions = rowOfSelectMenu.components[0].options.filter(option => option.data.default).map(option => option.data.value);
            const optionsToAdd = newOptions.filter(option => !oldOptions.includes(option));
            const optionsToRemove = oldOptions.filter(option => !newOptions.includes(option));
  
            for (let value of optionsToAdd) {
              if (interaction.member.roles.highest.position < interaction.guild.roles.cache.get(value).position) {
                return update(i);
              }
              await member.roles.add(value).catch(console.error);
            }
  
            for (let value of optionsToRemove) {
              if (interaction.member.roles.highest.position < interaction.guild.roles.cache.get(value).position) {
                return update(i);
              }
              await member.roles.remove(value).catch(console.error);
            }
  
            embed.setDescription(`\`\`\`Information du membre\`\`\`\n${member} (\`${member.id}\`)\n\n` +
              `\`\`\`Rôles actuels\`\`\`\n${member.roles.cache.map(role => `${role} (\`${role.id}\`)`).join("\n") || "Aucun rôle"}`);
            update(i);
          }
        });
      }
    };
  