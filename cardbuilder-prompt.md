I am developing a custom cardbuilder and sharing feature, where in the workshop area in my project, users can create and save custom squadrons, ships, and upgrades.

I talked to Claude in a previous chat and came up with this general structure for how to implement this. Since we have a supabase connection, I want to be able to save items there and then share them with other people through a new page. Not sure what best to call the page yet, maybe the "shipyard" or something, but yeah.

I know we had already made a custom_squadrons table and tested saving things there in the past, but I want to try to follow these things where possible.

In addition, we need to work on the frontend for that search page.

Infinite Arenas (a similar website but for X-Wing), has this page they call the Cantina. I thought we could maybe do something similar to this page as a way to search for things.

On the home index page we can make a "Shipyard" button next to the Workshop button, and in the UserMenu we should have a "downloaded content viewer" or something button next to the FleetList so users can see what they have already downloaded from the shipyard. We should store IDs of a user's downloaded items or something in a database on supabase with the user_ids, so that way someone can see what they have. In addition, across multiple devices we need a way to sync the sqlite database stored on their browser with the one in the cloud.

Lastly, there are other components which will need some changing to work with the cardbuilders, like the FleetBuilder component. We will need to have the custom content have a little numerical identifier in {} in the import aliases, so that way if someone saves a fleet with custom content in it, we can reference that alias from the database and make sure they are importing the right thing. Make sense?

Lots of things to work on, so let's just start with getting the groundwork laid for the squadron section for now.