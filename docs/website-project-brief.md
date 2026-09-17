# Legacy Garage 26 — Website Project Brief

## Project Overview

**Legacy Garage 26** is a youth-led automotive and engineering project based in California.

Our main project is restoring a **1968 Chevrolet Corvair** while documenting the entire process through photos, videos, interviews, educational content, and social media.

The project is not only about fixing one car. We want to use the Corvair as a starting point to explore:

* Classic car restoration
* Automotive engineering
* Chevrolet Corvair history
* Car culture
* Hands-on STEM learning
* Stories from Corvair owners and enthusiasts
* Knowledge from mechanics, engineers, professors, and industry experts
* Connections between younger and older generations of car enthusiasts

Our goal is to bring younger people into the classic car and engineering community while learning directly from experienced people.

---

## Main Story

The website should show the journey of a group of young builders working alongside experienced people to bring a **1968 Chevrolet Corvair back to life**.

The restoration process should be the central storyline.

Visitors should be able to follow the car from its current condition through different stages of restoration until it is eventually back on the road.

The project combines:

**Classic Cars + Engineering + Education + Storytelling + Community**

---

## What We Are Currently Doing

### 1. Restoring the 1968 Chevrolet Corvair

We are documenting the restoration step by step.

Content may include:

* Current condition of the car
* Problems we discover
* Parts removal
* Repairs
* Mechanical work
* Bodywork
* Engine work
* Parts replacement
* Testing
* Before-and-after comparisons
* Major restoration milestones

---

### 2. Creating Educational Content

We want people who know very little about Corvairs to understand why this car is interesting.

Some planned topics include:

* What is a Chevrolet Corvair?
* Why is the engine in the rear?
* How the Corvair's air-cooled engine works
* What made the Corvair different from other American cars
* Corvair engineering
* History of the Corvair
* Different Corvair generations and models
* Common mechanical problems
* The Corvair's place in American automotive history

---

### 3. Interviewing People

We plan to interview people connected to automotive engineering and Corvair culture.

Possible guests include:

* Corvair owners
* Long-time Corvair club members
* Mechanics
* Restoration experts
* Automotive engineers
* Mechanical engineering professors
* Collectors
* Auto industry professionals
* People who have worked with Corvairs for many years

The interviews will help preserve knowledge and stories from people who understand these cars.

---

### 4. Exploring Corvair Culture

We want the project to eventually become larger than just our own restoration.

We want to document the community around the Corvair, including:

* Owner stories
* Car clubs
* Events
* Restoration stories
* Rare Corvairs
* Personal memories connected to the car
* Corvair communities in the United States and other countries

This section can eventually become an archive of Corvair stories and knowledge.

---

### 5. Youth Engineering & Learning

An important part of Legacy Garage 26 is showing younger people that engineering does not have to start in a classroom.

The garage itself becomes a learning environment.

We are learning about:

* Mechanical systems
* Automotive engineering
* Tools
* Problem solving
* Design
* Teamwork
* Project management
* Media production
* Entrepreneurship

The website should communicate that this is a real hands-on learning experience.

---

## Website Purpose

The website should serve as the **main home of Legacy Garage 26**.

Social media will show short updates, but the website should contain the complete story.

The website should allow visitors to:

* Understand what Legacy Garage 26 is
* Learn about the 1968 Corvair
* Explore an interactive 3D Corvair model and parts breakdown
* Follow the restoration
* Meet the team
* Watch videos
* Read restoration updates
* Explore educational articles
* See interviews
* Learn about Corvair culture
* Contact the team
* Potentially support or collaborate with the project

---

# Suggested Website Structure

## Home

Strong visual introduction to the project.

Possible hero message:

**Bringing 1968 Back to Life.**

Short description:

Legacy Garage 26 is a youth-led project documenting the restoration of a 1968 Chevrolet Corvair while exploring engineering, history, and the community that keeps classic cars alive.

Include:

* Large Corvair photo/video
* Latest restoration update
* Project introduction
* Featured content
* Meet the team preview
* Follow the restoration button

---

## The Project

Explain:

* Why we started Legacy Garage 26
* Why we chose the Corvair
* What we hope to learn
* Our long-term vision

---

## The Corvair

An educational section introducing the Chevrolet Corvair.

Possible articles:

**What Is a Chevrolet Corvair?**

**Why Is the Engine in the Back?**

**The Engineering Behind the Corvair**

**A Short History of the Chevrolet Corvair**

---

## Restoration

This should be one of the most important sections.

Create a visual restoration timeline.

Example:

**Stage 01 — Starting Condition**

**Stage 02 — Inspection**

**Stage 03 — Disassembly**

**Stage 04 — Mechanical Restoration**

**Stage 05 — Body & Interior**

**Stage 06 — Reassembly**

**Stage 07 — Testing**

**Stage 08 — Back on the Road**

Each update could contain:

* Date
* Photos
* Videos
* What we worked on
* Problems discovered
* What we learned
* What's next

---

## Explore the Corvair — Interactive Model & Parts Breakdown

Integrate the existing **Corvair Anatomy** website into Legacy Garage 26 as a dedicated section. This interactive learning experience should connect the digital model of the 1968 Chevrolet Corvair with the team's real restoration work.

Proposed location: **/explore/**, with **Explore the Corvair** in the main navigation and a preview on the homepage and The Corvair page.

### Existing Experience to Preserve

The existing project's README documents:

* Rotate, zoom, and pan around the 3D car.
* Explore 13 functional assemblies, including the engine, steering, brakes, suspension, drivetrain, fuel, exhaust, electrical systems, wheels, seats, cabin, body, and lighting.
* Switch between assembled and exploded views, both for the whole car and within an assembly.
* Select, isolate, hide, and restore model objects.
* Search the parts directory and read names, purposes, operating explanations, locations, and related-part information.
* Explore 4,284 selectable model objects. These include modeled details and should not be presented as 4,284 distinct real-world service parts.

These capabilities are documented in the existing project; integration will require fresh browser verification within the main website.

### Connection to the Restoration Story

* Restoration updates should link to the relevant assembly or part in the explorer.
* The explorer should link to related restoration entries, photographs, videos, and educational articles when available.
* Real photographs should help visitors compare the digital representation with the team's actual car.
* Deep links to assemblies or parts are an integration requirement to implement and verify; they are not assumed to exist in the current viewer.

### Integration Requirements

* Reuse the existing viewer and model assets, applying Legacy Garage 26 branding and a clear return path to the main website.
* Give the viewer a spacious dedicated page and an optional full-screen mode.
* Keep the interactive model off the homepage's initial loading path. The existing README reports approximately 88 MB of model assets, so show a lightweight preview and load the viewer on request.
* Provide loading progress, a retry option, and an illustrated/text alternative if 3D rendering is unavailable.
* Preserve touch controls and provide a usable parts directory on smaller screens.
* Plan English interface and educational text for the main website; preserve the existing Chinese content as the basis for an optional language switch.
* Describe the model as an educational structural visualization. Its exploded views are not a verified repair sequence, and model-specific details should be checked against the team's actual vehicle.

### Initial Scope and Later Additions

First integration: make the existing viewer accessible from the main site, align branding, verify its controls and asset loading, and provide navigation back to the project.

Later additions: contextual restoration links, real-photo comparisons, guided system tours, and expanded bilingual educational content.

This section is now part of the website brief. It has not yet been integrated or deployed.

---

## Stories / Journal

A blog-style section for project content.

Categories could include:

* Restoration
* Engineering
* Corvair History
* Owner Stories
* Interviews
* Corvair Culture
* Behind the Scenes

---

## Interviews

A dedicated place for conversations with experts and enthusiasts.

Each interview page could contain:

* Person's name
* Photo
* Background
* Video
* Key quotes
* Full story
* What we learned

---

## Meet the Team

Introduce the young builders and other people helping with the project.

For each member:

* Photo
* Name
* Role
* Short bio

---

## Media

A visual archive containing:

* Videos
* Reels
* Photography
* Restoration footage
* Behind-the-scenes content

---

## Partners / Supporters

Future section for:

* Automotive companies
* Parts companies
* Tool companies
* Repair shops
* Schools
* STEM organizations
* Corvair clubs
* Community partners

---

## Contact

Contact email:

**[contact@legacygarage26.org](mailto:contact@legacygarage26.org)**

Possible contact reasons:

* Interview
* Collaboration
* Corvair story
* Technical advice
* Partnership
* Media
* Joining or supporting the project

---

# Visual Direction

The website should feel like a mix of:

**Classic American automotive culture + modern youth engineering project**

It should NOT feel like a normal school club website.

The design should feel professional enough to approach companies, professors, mechanics, car clubs, and potential partners.

Suggested style:

* Dark navy / deep blue
* White
* Metallic gray
* Small brighter blue accents
* Strong automotive photography
* Large typography
* Clean layouts
* Slight vintage influence without making the site look old

The Corvair should always be the visual focus.

---

# Brand

**Name:** Legacy Garage 26

**Main Vehicle:** 1968 Chevrolet Corvair

**Location:** California

**Contact:** [contact@legacygarage26.org](mailto:contact@legacygarage26.org)

Possible tagline:

**Old enough to be classic. Young enough to turn heads.**

Another project-oriented line:

**Bringing 1968 Back to Life.**

---

# Long-Term Vision

Legacy Garage 26 should eventually grow beyond documenting one restoration.

The goal is to build a platform where younger generations can discover classic cars, engineering, restoration knowledge, and the people behind automotive culture.

The 1968 Corvair is where that story begins.
