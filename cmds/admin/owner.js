module.exports = {
    name: 'owner',
    dm: false,
    description: "Owner un utilisateur",
    type: 1,
    options: [],

    go: async (client, db, config, interaction, args) => {
        function getListButtons() {
            return client.row()
                .addComponents(
                        client.button()
                        .setCustomId('add')
                        .setEmoji('1234797580626559066')
                        .setStyle(3),
                    client.button()
                        .setCustomId('remove')
                        .setEmoji('1234797584309288981')
                        .setStyle(4),
                    client.button()
                        .setCustomId('info')
                        .setEmoji('1054723227852746772')
                        .setStyle(2),
                    client.button()
                        .setCustomId('refresh')
                        .setEmoji('1076180719015051406')
                        .setStyle(1) 
                );
        }
        if (!config.owners.includes(interaction.user.id) && interaction.user.id !== interaction.guild.ownerId) return interaction.reply({ content: `\`❌\` *Vous n'avez pas les permission pour executé cette commande*`, ephemeral: true })
        
        const embed = client.embed()
            .setTitle("Owner")
            .setColor(0x2E3136);
    
        var content = "";
        const refreshOwnersList = async () => {
            content = "";
            const owners = db
                .all()
                .filter(data => data.ID.startsWith(`Owner_${interaction.guild.id}-`))
                .sort((a, b) => b.data - a.data);
    
            for (let i in owners) {
                const userData = await client.users.fetch(owners[i].ID.split('-')[1]);
                content += `\n<@${userData.id}> | \`${userData.id}\``;
            }

            if (content === "") {
                embed.setDescription("Aucun Owners trouvé.");
            } else {
                embed.setDescription(content);
            }
            interaction.editReply({
                embeds: [embed],
                components: [getListButtons()]
            });
        };
        await refreshOwnersList();
        interaction.reply({
            embeds: [embed],
            components: [getListButtons()]
        }).then(() => {
            const filter = i => i.customId === 'add' || i.customId === 'remove' || i.customId === 'info' || i.customId === 'refresh';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 999999 });
    
            collector.on('collect', async i => {
                i.deferUpdate().catch()
                if (i.customId === 'add') {
                    interaction.editReply({
                        embeds: [embed.setDescription('Veuillez mentionner l\'utilisateur ou fournir son ID pour l\'ajouter comme owner.')]
                    });
                    const addCollector = interaction.channel.createMessageCollector({
                        filter: msg => msg.author.id === interaction.user.id,
                        time: 15000
                    });
                    addCollector.on('collect', async msg => {
                        const mentionedUser = msg.mentions.users.first() || interaction.guild.members.cache.get(msg.content.trim());
                        if (mentionedUser) {
                            const ownerData = { AuthorTag: interaction.user.tag, AuthorID: interaction.user.id, Date: `<t:${Math.floor(Date.now() / 1000)}:R>` };
                            db.set(`Owner_${interaction.guild.id}-${mentionedUser.id}`, ownerData);
                            msg.delete().catch(console.error);
                            addCollector.stop();
                            setTimeout(refreshOwnersList, 350); 
                        }
                    });
                    addCollector.on('end', () => {
                        interaction.editReply({
                            embeds: [embed],
                            components: [getListButtons()]
                        });
                    });
                } else if (i.customId === 'remove') {
                    interaction.editReply({
                        embeds: [embed.setDescription('Veuillez mentionner l\'utilisateur pour le supprimer comme owner.')]
                    });
                    const removeCollector = interaction.channel.createMessageCollector({
                        filter: msg => msg.author.id === interaction.user.id,
                        time: 15000
                    });
                    removeCollector.on('collect', async msg => {
                        const mentionedUser = msg.mentions.users.first() || interaction.guild.members.cache.get(msg.content.trim());
                        if (mentionedUser) {
                            db.delete(`Owner_${interaction.guild.id}-${mentionedUser.id}`);
                            msg.delete().catch(console.error);
                            removeCollector.stop();
                            setTimeout(refreshOwnersList, 350); 
                        }
                    });
                    removeCollector.on('end', () => {
                        interaction.editReply({
                            embeds: [embed],
                            components: [getListButtons()]
                        });
                    });
                } else if (i.customId === 'refresh') {
                    await refreshOwnersList();
                    } else if (i.customId === 'info') {
                    interaction.editReply({
                        embeds: [embed.setDescription('Veuillez mentionner l\'utilisateur pour afficher ses informations.')]
                    });
                    const infoCollector = interaction.channel.createMessageCollector({
                        filter: msg => msg.author.id === interaction.user.id,
                        time: 15000
                    });
                    infoCollector.on('collect', async msg => {
                        const mentionedUser = msg.mentions.users.first() || interaction.guild.members.cache.get(msg.content.trim());
                        msg.delete().catch(console.error);
                        if (mentionedUser) {
                            const infoData = db.get(`Owner_${interaction.guild.id}-${mentionedUser.id}`);
                            if (infoData) {
                                const ownerTag = await client.users.fetch(infoData.AuthorID);
                                const victimTag = await client.users.fetch(mentionedUser.id);
                                const infoEmbed = client.embed()
                                    .setColor(0x2E3136)
                                    .setDescription(`
                                        **__Informations Owners__**
    
                                        **Auteur : **
                                        Nom d'utilisateur : ${ownerTag}
                                        Identifiant : \`${infoData.AuthorID}\`
    
                                        **Cible : **
                                        Nom d'utilisateur : ${victimTag}
                                        Identifiant : \`${mentionedUser.id}\`
    
                                        **Information Supplémentaire**
                                        Date : ${infoData.Date}
                                    `);
                                interaction.editReply({ embeds: [infoEmbed], components: [getListButtons()] });
                            } else {
                                interaction.editReply({ embeds: [embed.setDescription('Cet utilisateur n\'est pas owner !')] });
                            }
                        }
                    });
                }
            });
    
            collector.on('end', collected => {
                interaction.editReply({ components: [] });
            });
        });
    }
};


