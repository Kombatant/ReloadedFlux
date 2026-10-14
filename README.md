# ReloadedFlux

> [!IMPORTANT]  
> Used various LLMs as a playground for code generation and assistance in forking/structuring/coding the project.

This fork was initially created to add some stuff that I was sorely missing from the original excellent work the ReactFlux devs had already done. It now continues as ReloadedFlux, since the scope of the changes has expanded significantly. Here are some note worthy additions:

- A visual refresh and a second combined layout option. In this layout, there is a left sidebar for feeds and categories, and a right sidebar for article content. The original layout is still available as an option.
  ![](images/reloadedflux_combined.png)

- Resizable panes
- Mark as read functionality based on days
  ![](images/reloadedflux_markasread.png)

- AI Summarization of articles
  ![](images/reloadedflux_ai.png)

- Settings menus have been revamped, with more options present.
  ![](images/reloadedflux_appearance.png)

- Some theme changes I was applying with Tampermonkey up until now, with tweaks to colours, fonts and spacing.
  ![](images/reloadedflux_columns.png)

- Various additional improvements, including timeline view, Greek localization support and automatic feed refresh when clicking on feeds or categories.
  ![](images/reloadedflux_timeline.png)

This fork is my daily driver but it is bound to have bugs, so the usual apply; use at your own peril etc. For more info about the original project lineage, go read the upstream README contents from electh/ReactFlux:main.

# Installation

Just get the build branch contents and publish them in your favourite web server (yes, even Cloudflare Pages works). Then login with your Miniflux credentials and enjoy.
