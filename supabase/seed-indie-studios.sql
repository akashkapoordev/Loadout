-- ─── INDIE & SMALL STUDIOS ──────────────────────────────────
insert into studios (id, name, logo_initials, logo_color, logo_bg, location, description, website, twitter, linkedin, founded, disciplines) values

('supergiant-games',  'Supergiant Games',  'SG',  '#FFD166', '#1A0A00', 'San Francisco, CA', 'Supergiant Games is an independent studio of about 20 developers. We make Bastion, Transistor, Pyre, and Hades — narrative action games built by a tiny close-knit team.',                              'https://supergiantgames.com', 'supergiantgames', 'supergiant-games', 2009, array['Game Design','Engineering','Art & VFX','Audio','Writing']),

('innersloth',        'Innersloth',        'IL',  '#C72348', '#1A0005', 'Redmond, WA',       'Innersloth is the small studio behind Among Us and Henry Stickmin. We are a remote-first team who believe great games come from small passionate teams with full creative ownership.',                     'https://innersloth.com',      'innersloth',      null,               2015, array['Engineering','Game Design','Art & VFX','Marketing']),

('sabotage-studio',   'Sabotage Studio',   'SS',  '#5B9BD5', '#050D18', 'Montreal, Canada',  'Sabotage Studio is the indie studio behind The Messenger and Sea of Stars. We care deeply about pixel art, music, and nostalgic RPG craft. Small team, full creative control.',                          'https://sabotagestudio.com',  'sabotagestudio',  null,               2016, array['Game Design','Art & VFX','Engineering','Audio']),

('motion-twin',       'Motion Twin',       'MT',  '#39FF83', '#001A0A', 'Bordeaux, France',  'Motion Twin is a worker-owned co-op of 15 developers behind Dead Cells. No hierarchy, no crunch, no bosses — just a team of passionate developers shipping world-class games.',                          'https://motion-twin.com',     'motiontwin',      null,               2001, array['Engineering','Game Design','Art & VFX']),

('klei-entertainment','Klei Entertainment','KL',  '#F4A261', '#1A0E00', 'Vancouver, Canada', 'Klei Entertainment is an independent studio building games like Don''t Starve, Oxygen Not Included, and Mark of the Ninja. We value craft, creativity, and a sustainable pace of work.',                 'https://klei.com',            'kleientertainment','klei-entertainment',2005, array['Engineering','Art & VFX','Game Design','Audio','Production']),

('raw-fury',          'Raw Fury',          'RF',  '#FF6B6B', '#1A0000', 'Stockholm, Sweden', 'Raw Fury is a micro-publisher that partners with indie developers. We take on publishing and marketing so devs can focus on the game. Fully remote and indie-first in everything we do.',                 'https://rawfury.com',         'rawfury',         'raw-fury',         2015, array['Marketing','Production','Analytics']),

('finji',             'Finji',             'FJ',  '#A8DADC', '#04141A', 'Grand Rapids, MI',  'Finji is a tiny indie studio and publisher behind Night in the Woods and Overland. We work with independent developers who have something important and personal to say through games.',                   'https://finji.co',            'wearefinji',      null,               2013, array['Game Design','Art & VFX','Engineering','Writing']),

('amanita-design',    'Amanita Design',    'AD',  '#7BC67E', '#071A08', 'Brno, Czech Republic','Amanita Design is an independent studio behind Machinarium, Botanicula, and Creaks. We make hand-crafted adventure games driven by original art, music, and whimsical puzzle design.',                 'https://amanita-design.net',  'amanitadesign',   null,               2003, array['Art & VFX','Game Design','Audio']),

('subset-games',      'Subset Games',      'SB',  '#E2B96F', '#1A1000', 'Seattle, WA',       'Subset Games is a two-person studio behind FTL: Faster Than Light and Into the Breach. Proof that small teams can build genre-defining games with focused design and years of polish.',                   'https://subsetgames.com',     'subsetgames',     null,               2011, array['Game Design','Engineering','Art & VFX']),

('tinyBuild',         'tinyBuild',         'TB',  '#FF9F1C', '#1A0900', 'Amsterdam, Netherlands','tinyBuild is an indie publisher and developer behind Hello Neighbor, SpeedRunners, and Graveyard Keeper. We back unique indie titles and help developers reach global audiences.',                   'https://tinybuild.com',       'tinyBuild',       'tinybuild',        2012, array['Marketing','Engineering','Production','Game Design'])

on conflict (id) do nothing;


-- ─── INDIE STUDIO JOBS ──────────────────────────────────────
insert into jobs (id, studio_id, title, company, company_logo, company_color, location, remote, discipline, experience_level, salary_band, salary, tags, posted_at, description, apply_url) values

-- Supergiant Games
('sgames-narrative-designer', 'supergiant-games', 'Narrative Designer', 'Supergiant Games', 'SG', '#FFD166', 'San Francisco, CA', false, 'Writing', 'Mid',
 '$100-150k', '$110–130k', array['new'],
 now() - interval '2 days',
 '<p>Supergiant Games is looking for a Narrative Designer to join our small team. You''ll work directly with the creative director to shape how story, dialogue, and world-building come together in our next project.</p><h3>What you''ll do</h3><ul><li>Write and implement in-engine dialogue for characters and events</li><li>Collaborate on quest and encounter design that reinforces narrative goals</li><li>Help define the tone, voice, and backstory of the game world</li></ul><h3>What we''re looking for</h3><ul><li>Shipped at least one narrative-driven game as a designer or writer</li><li>Comfortable working in small, high-trust teams with minimal process</li><li>A genuine love for games and a strong sense of what makes stories feel alive</li></ul><p>We are a small studio and everyone wears multiple hats. You should be excited about that, not nervous.</p>',
 'https://supergiantgames.com/jobs'),

('sgames-gameplay-engineer', 'supergiant-games', 'Gameplay Engineer', 'Supergiant Games', 'SG', '#FFD166', 'San Francisco, CA', false, 'Engineering', 'Senior',
 '$100-150k', '$130–155k', array['hot'],
 now() - interval '5 days',
 '<p>We are looking for a gameplay-focused engineer to help build the core mechanics and systems for our next game. You''ll work closely with design and art, and your code will be played by millions of people.</p><h3>What you''ll do</h3><ul><li>Implement combat, movement, and interaction systems in C#</li><li>Profile and optimise performance-critical game code</li><li>Prototype new mechanics quickly and iterate based on playtesting</li></ul><h3>Requirements</h3><ul><li>3+ years of shipped game experience in a gameplay engineering role</li><li>Strong C# and Unity skills</li><li>Ability to collaborate closely with non-technical team members</li></ul>',
 'https://supergiantgames.com/jobs'),

-- Innersloth
('innersloth-community-manager', 'innersloth', 'Community Manager', 'Innersloth', 'IL', '#C72348', 'Remote', true, 'Marketing', 'Mid',
 '$60-100k', '$75–90k', array['remote','new'],
 now() - interval '1 day',
 '<p>Innersloth is hiring a Community Manager to be the voice of Among Us across our social platforms. You''ll engage with millions of players every day and shape how our community grows.</p><h3>Responsibilities</h3><ul><li>Manage Twitter, TikTok, Instagram, and Discord for Among Us</li><li>Plan and run community events, fan art contests, and AMAs</li><li>Monitor player sentiment and surface key feedback to the dev team</li><li>Collaborate on seasonal campaigns and game update communications</li></ul><h3>About you</h3><ul><li>1–3 years of community management experience, ideally in games</li><li>You play games and genuinely understand gaming culture</li><li>Excellent writing voice — warm, funny, and on-brand</li></ul>',
 'https://innersloth.com/jobs'),

('innersloth-web-developer', 'innersloth', 'Frontend Web Developer', 'Innersloth', 'IL', '#C72348', 'Remote', true, 'Engineering', 'Junior',
 '$60-100k', '$65–80k', array['remote'],
 now() - interval '8 days',
 '<p>We are looking for a frontend developer to maintain and expand the Among Us website and our internal web tools. This is a great entry-level role if you want game industry experience without needing to be a Unity dev.</p><h3>What you''ll do</h3><ul><li>Maintain and improve the Among Us marketing site</li><li>Build internal dashboards for tracking game metrics</li><li>Work with the team on seasonal event pages and patch note layouts</li></ul><h3>Requirements</h3><ul><li>Solid HTML, CSS, JavaScript skills</li><li>Experience with React or similar framework</li><li>Self-motivated and comfortable working fully remote</li></ul>',
 'https://innersloth.com/jobs'),

-- Sabotage Studio
('sabotage-pixel-artist', 'sabotage-studio', 'Pixel Artist', 'Sabotage Studio', 'SS', '#5B9BD5', 'Montreal, Canada', false, 'Art & VFX', 'Mid',
 '$60-100k', '$70–90k', array['new'],
 now() - interval '3 days',
 '<p>Sabotage Studio is seeking a talented Pixel Artist to join our art team. You''ll create characters, environments, animations, and UI assets for our next retro-inspired RPG.</p><h3>What you''ll do</h3><ul><li>Create high-quality pixel art for characters, enemies, and environments</li><li>Animate sprites with a focus on readability and game-feel</li><li>Collaborate with the art director to maintain a cohesive visual style</li></ul><h3>Requirements</h3><ul><li>Strong pixel art portfolio demonstrating animation skills</li><li>Experience with Aseprite or similar tools</li><li>Love for 16-bit era games and an eye for detail</li></ul>',
 'https://sabotagestudio.com/jobs'),

-- Motion Twin
('motiontwin-backend-dev', 'motion-twin', 'Backend Developer', 'Motion Twin', 'MT', '#39FF83', 'Bordeaux, France', true, 'Engineering', 'Senior',
 '$100-150k', '€80–100k', array['remote'],
 now() - interval '6 days',
 '<p>Motion Twin is a flat, worker-owned co-op with no managers and no crunch. We''re looking for a backend developer to help us scale the infrastructure behind Dead Cells and our next project.</p><h3>What you''ll do</h3><ul><li>Design and maintain our game backend services (leaderboards, save sync, telemetry)</li><li>Help architect systems for our next multiplayer-connected title</li><li>Participate in co-op decisions — your voice matters in how we run the studio</li></ul><h3>Requirements</h3><ul><li>4+ years backend development experience (Golang, Rust, or similar)</li><li>Experience with game backends or real-time systems a strong plus</li><li>Comfortable in a self-directed, non-hierarchical work environment</li></ul>',
 'https://motion-twin.com/jobs'),

-- Klei Entertainment
('klei-gameplay-programmer', 'klei-entertainment', 'Gameplay Programmer', 'Klei Entertainment', 'KL', '#F4A261', 'Vancouver, Canada', false, 'Engineering', 'Mid',
 '$100-150k', 'CAD 95–120k', array['new'],
 now() - interval '4 days',
 '<p>Klei Entertainment is hiring a gameplay programmer to work on one of our unannounced projects. We build games that are deep, creative, and crafted with real care — and we need engineers who share that ethos.</p><h3>Responsibilities</h3><ul><li>Implement and iterate on core gameplay systems</li><li>Work closely with designers to prototype and polish mechanics</li><li>Contribute to tools and pipeline improvements</li></ul><h3>Requirements</h3><ul><li>2+ years games industry experience as a programmer</li><li>Strong C++ or C# skills</li><li>Passion for indie game craft and player experience</li></ul>',
 'https://klei.com/jobs'),

('klei-ux-designer', 'klei-entertainment', 'UX / UI Designer', 'Klei Entertainment', 'KL', '#F4A261', 'Vancouver, Canada', false, 'Game Design', 'Mid',
 '$60-100k', 'CAD 80–100k', array[]::text[],
 now() - interval '11 days',
 '<p>We are looking for a UX/UI Designer who cares deeply about how players experience games. You''ll own interface design and usability across our projects, from initial wireframes to final polished screens.</p><h3>What you''ll do</h3><ul><li>Design menus, HUD, and in-game UI that are clear and beautiful</li><li>Run playtests and use feedback to iterate quickly</li><li>Partner with engineering to implement UI systems in-engine</li></ul><h3>About you</h3><ul><li>Portfolio demonstrating shipped game UI or UX work</li><li>Fluency in Figma or similar design tools</li><li>Systems thinker who can balance aesthetics with usability</li></ul>',
 'https://klei.com/jobs'),

-- Raw Fury
('rawfury-marketing-coordinator', 'raw-fury', 'Marketing Coordinator', 'Raw Fury', 'RF', '#FF6B6B', 'Stockholm, Sweden', true, 'Marketing', 'Junior',
 '<$60k', '€40–55k', array['remote','new'],
 now() - interval '2 days',
 '<p>Raw Fury is a micro-publisher that champions indie games. We''re hiring a Marketing Coordinator to support our growing roster of partner developers with campaigns, press, and community work.</p><h3>What you''ll do</h3><ul><li>Assist on launch campaigns for our indie partner titles</li><li>Build media lists and coordinate review key distribution</li><li>Help run social media across our portfolio of games</li><li>Work with developers on their individual marketing strategies</li></ul><h3>Requirements</h3><ul><li>Passion for indie games — you buy and play them</li><li>1+ year of marketing or PR experience (games or creative industries)</li><li>Excellent written English and strong organisational skills</li></ul>',
 'https://rawfury.com/jobs'),

-- Finji
('finji-producer', 'finji', 'Producer (Remote)', 'Finji', 'FJ', '#A8DADC', 'Remote', true, 'Production', 'Mid',
 '$60-100k', '$70–85k', array['remote'],
 now() - interval '7 days',
 '<p>Finji is a tiny studio and publisher. We''re looking for a producer who can juggle multiple small projects with indie developers who are making personal, meaningful games. No red tape — just getting good things shipped.</p><h3>What you''ll do</h3><ul><li>Manage timelines and deliverables across 2–3 partner developer projects</li><li>Serve as the communication bridge between dev teams and our publishing side</li><li>Help developers identify scope risks early and solve them collaboratively</li></ul><h3>Requirements</h3><ul><li>Shipped at least one game in a production or project management role</li><li>Strong communicator who can work across time zones</li><li>You care about the humans making the game, not just the milestone</li></ul>',
 'https://finji.co/jobs'),

-- Amanita Design
('amanita-animator', 'amanita-design', '2D Animator', 'Amanita Design', 'AD', '#7BC67E', 'Brno, Czech Republic', false, 'Art & VFX', 'Mid',
 '$60-100k', 'CZK 60–80k/mo', array['new'],
 now() - interval '1 day',
 '<p>Amanita Design creates hand-crafted adventure games known for their unique visual identity. We are looking for a 2D Animator to bring our characters and worlds to life for our upcoming project.</p><h3>What you''ll do</h3><ul><li>Create frame-by-frame and rigged animations for characters and creatures</li><li>Collaborate with illustrators to ensure animation matches the art direction</li><li>Animate environmental elements, UI transitions, and cutscenes</li></ul><h3>Requirements</h3><ul><li>Portfolio of 2D character animation work</li><li>Experience with Spine, DragonBones, or After Effects</li><li>Appreciation for handcrafted, painterly game aesthetics</li></ul>',
 'https://amanita-design.net/jobs'),

-- tinyBuild
('tinybuild-qa-tester', 'tinyBuild', 'QA Tester', 'tinyBuild', 'TB', '#FF9F1C', 'Amsterdam, Netherlands', true, 'Production', 'Junior',
 '<$60k', '€30–40k', array['remote','new'],
 now() - interval '3 days',
 '<p>tinyBuild is hiring a QA Tester to help ensure the quality of our indie publishing portfolio. You''ll test games across multiple genres and platforms, and work closely with partner developers to crush bugs before launch.</p><h3>What you''ll do</h3><ul><li>Write and execute test plans for games in pre-release stages</li><li>Log, track, and verify bugs using project management tools</li><li>Provide detailed reproduction steps and screenshots</li><li>Communicate directly with partner dev teams during crunch periods</li></ul><h3>Requirements</h3><ul><li>Experience with structured game testing or QA in any industry</li><li>Methodical and detail-oriented</li><li>Able to write clear, concise bug reports in English</li></ul>',
 'https://tinybuild.com/jobs')

on conflict (id) do nothing;
