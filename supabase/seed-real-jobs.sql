-- ─── REAL STUDIOS (new entries only) ────────────────────────
insert into studios (id, name, logo_initials, logo_color, logo_bg, location, description, website, twitter, linkedin, founded, disciplines) values

('paradox-interactive', 'Paradox Interactive', 'PDX', '#CC0000', '#1A0000', 'Stockholm, Sweden',
 'Paradox Interactive is a Swedish video game publisher and developer behind Crusader Kings, Victoria, Stellaris, and Cities: Skylines. Known for deep grand strategy games with passionate fan communities.',
 'https://paradoxinteractive.com', 'PdxInteractive', 'paradox-interactive', 1999,
 array['Game Design','Engineering','Art & VFX','Marketing','Production','Analytics']),

('ghost-story-games', 'Ghost Story Games', 'GSG', '#7C3AED', '#0D0014', 'Massachusetts, USA',
 'Ghost Story Games is Ken Levine''s studio creating Judas, a narrative-driven immersive sci-fi FPS. A small, senior-heavy team known for pushing the boundaries of interactive storytelling.',
 'https://ghoststorygames.com', 'ghoststorygames', null, 2017,
 array['Game Design','Engineering','Art & VFX','Audio','Writing']),

('bungie', 'Bungie', 'BNG', '#4F87C5', '#050D18', 'United States (Remote)',
 'Bungie is the independent studio behind Destiny 2 and the original Halo series. A fully distributed team building large-scale multiplayer worlds with Sony Interactive Entertainment backing.',
 'https://bungie.net', 'Bungie', 'bungie', 1991,
 array['Engineering','Art & VFX','Game Design','Audio','Production','Analytics']),

('monomi-park', 'Monomi Park', 'MP', '#FF6EC7', '#1A000F', 'San Mateo, CA',
 'Monomi Park is the indie studio behind the Slime Rancher series. A small, close-knit team building colourful, wholesome exploration games in Unreal Engine 5.',
 'https://monomipark.com', 'MonomiPark', null, 2015,
 array['Game Design','Engineering','Art & VFX','Audio']),

('mojang-studios', 'Mojang Studios', 'MJG', '#62B73B', '#071A04', 'Stockholm, Sweden',
 'Mojang Studios is the Microsoft-owned studio behind Minecraft, the best-selling video game of all time. A passionate team of developers continuing to grow and evolve one of gaming''s most iconic worlds.',
 'https://mojang.com', 'Mojang', 'mojang-studios', 2009,
 array['Game Design','Engineering','Art & VFX','Audio','Production']),

('funcom', 'Funcom', 'FC', '#D97706', '#140900', 'Oslo, Norway',
 'Funcom is a veteran developer and publisher behind Dune: Awakening, Conan Exiles, and Secret World Legends. An independent studio with 30+ years in online multiplayer games.',
 'https://funcom.com', 'funcom', 'funcom', 1993,
 array['Engineering','Game Design','Art & VFX','Production','Audio']),

on conflict (id) do nothing;


-- ─── REAL OPEN JOBS ──────────────────────────────────────────
insert into jobs (id, studio_id, title, company, company_logo, company_color, location, remote, discipline, experience_level, salary_band, salary, tags, posted_at, description, apply_url) values

-- Paradox Interactive
('pdx-game-designer-victoria3', 'paradox-interactive', 'Game Designer — Victoria 3', 'Paradox Interactive', 'PDX', '#CC0000',
 'Stockholm, Sweden', false, 'Game Design', 'Senior', null, null, array[]::text[],
 now() - interval '14 days',
 '<p>Design and implement new systems and features for the live strategy title Victoria 3. You will be expected to work autonomously, mentor junior designers, maintain design documentation, and collaborate cross-discipline under the Game Director''s vision.</p><h3>Responsibilities</h3><ul><li>Own and deliver significant design features from concept to shipped</li><li>Write and maintain detailed design documentation</li><li>Coach and review the work of junior designers</li><li>Collaborate with programming and art to implement features in-engine</li></ul><h3>Requirements</h3><ul><li>3+ years professional game design experience</li><li>Shipped at least one strategy or simulation title</li><li>Background in history, economics, or politics is a bonus</li></ul>',
 'https://career.paradoxplaza.com/jobs/7446026-experienced-game-designer-victoria-3'),

('pdx-gameplay-programmer-stellaris', 'paradox-interactive', 'Senior Gameplay Programmer — Stellaris', 'Paradox Interactive', 'PDX', '#CC0000',
 'Stockholm, Sweden', false, 'Engineering', 'Senior', '<$60k', 'SEK 47,000+/mo', array['hot'],
 now() - interval '18 days',
 '<p>Design and implement complex gameplay systems for Stellaris expansions. Drive technical decisions, mentor junior programmers, and collaborate closely with designers and artists within a large, established codebase.</p><h3>Responsibilities</h3><ul><li>Design and deliver major architectural systems for Stellaris</li><li>Mentor junior and mid-level programmers</li><li>Collaborate with designers to scope and implement features</li></ul><h3>Requirements</h3><ul><li>5+ years professional C++ game development experience</li><li>Experience with large, live-service game codebases</li><li>Ability to own your domain and drive technical direction</li></ul>',
 'https://career.paradoxplaza.com/jobs/7350489-experienced-gameplay-programmer-stellaris'),

('pdx-game-designer-ckiii', 'paradox-interactive', 'Game Designer — Crusader Kings III', 'Paradox Interactive', 'PDX', '#CC0000',
 'Stockholm, Sweden', false, 'Game Design', 'Mid', null, null, array['new'],
 now() - interval '5 days',
 '<p>A generalist developer role on CKIII''s live game team. Responsibilities span designing gameplay features, writing narrative events, performing balance adjustments, and translating historical research into game systems.</p><h3>What you''ll do</h3><ul><li>Design and script new gameplay features using Paradox''s proprietary scripting language</li><li>Write narrative events and character interactions</li><li>Tune and balance existing systems based on player data and feedback</li></ul><h3>Requirements</h3><ul><li>2+ years game design experience</li><li>Passion for historical strategy games</li><li>Paradox scripting or modding experience is a strong differentiator</li></ul>',
 'https://career.paradoxplaza.com/jobs/7354020-game-designer-crusader-kings-iii'),

('pdx-product-marketing-manager', 'paradox-interactive', 'Product Marketing Manager', 'Paradox Interactive', 'PDX', '#CC0000',
 'Stockholm, Sweden', false, 'Marketing', 'Senior', null, null, array[]::text[],
 now() - interval '22 days',
 '<p>Lead end-to-end marketing campaigns for assigned Paradox titles. Manage a team of marketing specialists, develop messaging and budgets, present campaign performance reports, and align with development studios across the management games portfolio.</p><h3>Responsibilities</h3><ul><li>Own full marketing campaigns from strategy to execution for Cities: Skylines and other titles</li><li>Manage and develop a small team of marketing specialists</li><li>Define messaging, positioning, and go-to-market plans</li><li>Report on campaign performance to leadership</li></ul><h3>Requirements</h3><ul><li>5+ years video game marketing experience</li><li>Experience marketing a live-service PC or console title</li><li>Proven ability to lead and mentor a marketing team</li></ul>',
 'https://career.paradoxplaza.com/jobs/7297357-product-marketing-manager'),

-- Ghost Story Games
('gsg-design-manager', 'ghost-story-games', 'Design Manager', 'Ghost Story Games', 'GSG', '#7C3AED',
 'Massachusetts, USA', true, 'Game Design', 'Lead', '$150k+', '$130,000–$170,000', array['remote','hot'],
 now() - interval '9 days',
 '<p>Player-facing systems design manager on Judas, a narrative-driven first-person game in Unreal Engine. Responsible for gameplay system documentation, prototyping in UE Blueprints, personnel management, and cross-functional collaboration.</p><h3>What you''ll do</h3><ul><li>Own significant gameplay systems design areas on Judas</li><li>Manage and grow the systems design sub-team</li><li>Prototype mechanics in Unreal Engine Blueprints</li><li>Collaborate closely with the narrative and engineering teams</li></ul><h3>Requirements</h3><ul><li>5+ years in systems design, with at least one shipped AAA title</li><li>Prior people management experience</li><li>Deep Unreal Engine knowledge (Blueprints required; C++ a plus)</li></ul>',
 'https://job-boards.greenhouse.io/gsgcareers/jobs/7290754'),

-- Bungie
('bungie-sr-lighting-artist', 'bungie', 'Senior Lighting Artist — Marathon', 'Bungie', 'BNG', '#4F87C5',
 'United States', true, 'Art & VFX', 'Senior', '$100-150k', '$102,000–$125,000', array['remote','new'],
 now() - interval '3 days',
 '<p>Own creation of real-time lighting for significant portions of Marathon''s in-game worlds. Work with art direction to develop dynamic lighting and character rigs for Bungie''s upcoming extraction shooter.</p><h3>Responsibilities</h3><ul><li>Create and own real-time lighting for major game environments</li><li>Develop dynamic lighting setups and character lighting rigs</li><li>Partner with the art director to maintain visual consistency</li></ul><h3>Requirements</h3><ul><li>5+ years lighting experience on shipped AAA titles</li><li>Strong foundation in color theory and PBR materials</li><li>Proficiency in Unreal Engine 4/5 or Unity3D</li></ul>',
 'https://job-boards.greenhouse.io/bungie/jobs/5729343004'),

-- Insomniac Games (already in DB)
('insomniac-lead-vfx-artist', 'insomniac-games', 'Lead VFX Artist', 'Insomniac Games', 'IG', '#6B21A8',
 'United States', true, 'Art & VFX', 'Lead', '$150k+', '$153,000–$230,400', array['remote','featured'],
 now() - interval '7 days',
 '<p>Hands-on leadership role managing the VFX team and developing production pipelines for an unannounced PlayStation title. Requires advanced Houdini and Maya proficiency plus real-time particle systems experience.</p><h3>Responsibilities</h3><ul><li>Lead and mentor the VFX team across an unannounced AAA title</li><li>Develop and own the VFX production pipeline</li><li>Create high-quality hero VFX using Houdini, Maya, and Niagara</li><li>Hire and evaluate VFX talent with the art director</li></ul><h3>Requirements</h3><ul><li>8+ years VFX experience with at least one shipped AAA console title</li><li>Advanced Houdini and Maya skills</li><li>Experience with Niagara, PopcornFX, or similar real-time VFX systems</li><li>HLSL/VEX shader writing experience</li></ul>',
 'https://job-boards.greenhouse.io/insomniac/jobs/5806130004'),

-- Monomi Park
('monomi-sr-game-designer', 'monomi-park', 'Senior Game Designer', 'Monomi Park', 'MP', '#FF6EC7',
 'San Mateo, CA', false, 'Game Design', 'Senior', '$100-150k', '$120,000–$150,000', array['new'],
 now() - interval '6 days',
 '<p>Own significant gameplay design areas and drive features from prototype to polish in Unreal Engine 5. Responsibilities include Blueprint scripting, playtesting, design documentation, and mentoring junior designers.</p><h3>What you''ll do</h3><ul><li>Design, prototype, and ship major gameplay features in UE5</li><li>Script gameplay logic in Unreal Blueprints</li><li>Run and analyse playtests and iterate based on findings</li><li>Mentor junior members of the design team</li></ul><h3>Requirements</h3><ul><li>5+ years game design experience with at least one shipped title</li><li>Strong Unreal Engine Blueprint skills</li><li>Multiplayer or co-op design experience preferred</li></ul>',
 'https://job-boards.greenhouse.io/monomipark/jobs/5828530004'),

-- Mojang Studios
('mojang-sr-technical-designer', 'mojang-studios', 'Senior Technical Designer', 'Mojang Studios', 'MJG', '#62B73B',
 'Stockholm, Sweden', false, 'Game Design', 'Senior', null, null, array[]::text[],
 now() - interval '11 days',
 '<p>Work closely with designers, engineers, and stakeholders to create high-quality hand-crafted experiences for Minecraft. A core part of the development process from ideation and design through implementation and polish.</p><h3>What you''ll do</h3><ul><li>Design and implement hand-crafted Minecraft experiences and features</li><li>Bridge design and engineering — translating creative vision into technical implementation</li><li>Collaborate with key stakeholders across the organisation</li></ul><h3>Requirements</h3><ul><li>5+ years in a technical or systems design role</li><li>Deep understanding of Minecraft''s content creation tools</li><li>Based in or willing to relocate to Stockholm (hybrid — 2 days on-site)</li></ul>',
 'https://job-boards.greenhouse.io/mojangab/jobs/5814429004'),

-- Funcom
('funcom-specialized-qa', 'funcom', 'Specialized QA Tester', 'Funcom', 'FC', '#D97706',
 'Bucharest, Romania', false, 'Production', 'Mid', '<$60k', null, array[]::text[],
 now() - interval '13 days',
 '<p>Create and execute test suites for Dune: Awakening and other Funcom titles. Validate feature integration across game systems and run regression checks at the intersection of development and full functional validation.</p><h3>What you''ll do</h3><ul><li>Design and execute structured test plans for Unreal Engine game builds</li><li>Log, track, and verify bugs using Jira</li><li>Run regression testing on feature integrations</li><li>Communicate directly with developers during validation sprints</li></ul><h3>Requirements</h3><ul><li>3–5 years QA experience, ideally in games</li><li>Familiarity with SCRUM methodology</li><li>C++, SQL, or Python background a plus</li></ul>',
 'https://jobs.funcom.com/jobs/6665077-specialized-qa-tester'),

on conflict (id) do nothing;
