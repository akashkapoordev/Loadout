-- ─── STUDIOS (manually curated) ────────────────────────────
insert into studios (id, name, logo_initials, logo_color, logo_bg, location, description, website, twitter, linkedin, founded, disciplines) values
('riot-games',      'Riot Games',      'RG',  '#F0E6D3', '#D0392B', 'Los Angeles, CA',  'Riot Games is dedicated to being the most player-focused game company in the world. We make League of Legends, Valorant, Teamfight Tactics, and more.',        'https://riotgames.com',       'riotgames',       'riot-games',       2006, array['Game Design','Engineering','Art & VFX','Marketing','Audio','Production']),
('naughty-dog',     'Naughty Dog',     'ND',  '#FFFFFF', '#1A1A2E', 'Santa Monica, CA', 'Naughty Dog is one of the most critically acclaimed video game studios in the industry, responsible for The Last of Us, Uncharted, and Crash Bandicoot.',      'https://naughtydog.com',      'naughty_dog',     null,               1984, array['Engineering','Art & VFX','Writing','Audio','Production']),
('cd-projekt-red',  'CD Projekt Red',  'CD',  '#FF3A3A', '#1C1C1C', 'Warsaw, Poland',   'CD PROJEKT RED is an independent AAA game development studio behind The Witcher series and Cyberpunk 2077.',                                                   'https://cdprojektred.com',    'cdprojektred',    'cd-projekt-red',   2002, array['Game Design','Engineering','Art & VFX','Writing','Audio']),
('ubisoft-toronto', 'Ubisoft Toronto', 'UBI', '#FFFFFF', '#0D3B6E', 'Toronto, Canada',  'Ubisoft Toronto is home to Splinter Cell: Blacklist and Immortals Fenyx Rising. We are building an open, inclusive culture at the forefront of game development.', 'https://toronto.ubisoft.com', 'ubisofttoronto',  'ubisoft-toronto',  2009, array['Game Design','Engineering','Art & VFX','Production','Analytics']),
('insomniac-games', 'Insomniac Games', 'IG',  '#FFFFFF', '#6B21A8', 'Burbank, CA',      'Insomniac Games is the studio behind Marvel''s Spider-Man, Ratchet & Clank, and Sunset Overdrive. A Sony Interactive Entertainment studio.',                   'https://insomniacgames.com',  'insomniacgames',  null,               1994, array['Game Design','Engineering','Art & VFX','Audio','Marketing']),
('hello-games',     'Hello Games',     'HG',  '#39FF83', '#0F1C14', 'Guildford, UK',    'Hello Games is the indie studio behind No Man''s Sky — a game about exploration and survival in an infinite procedurally generated universe.',                   'https://hellogames.org',      'hellogames',      null,               2008, array['Engineering','Art & VFX','Game Design'])
on conflict (id) do nothing;

-- ─── AUTHORS (manually curated) ─────────────────────────────
insert into authors (id, name, role, bio, twitter, linkedin) values
('author-1', 'Maya Chen',    'Senior Game Designer at Riot Games',    '10+ years designing competitive systems for League of Legends and Valorant. Passionate about player psychology and emergent gameplay.',                                           'mayachen_gd',   'maya-chen-gd'),
('author-2', 'James Okafor', 'Technical Director at CD Projekt Red',  'Engine programmer turned technical director. Shipped The Witcher 3 and Cyberpunk 2077. Writes about rendering, tools, and team scaling.',                                          'jokafor_tech',  'james-okafor'),
('author-3', 'Sofia Reyes',  'Lead Environment Artist at Naughty Dog', 'Environment artist specialising in photorealistic worlds. Worked on The Last of Us Part II and Uncharted 4.',                                                                     'sofiareyes_art', null),
('author-4', 'Liam Park',    'Indie Developer & YouTuber',             'Solo dev behind the survival game Driftwood. Shares weekly dev logs documenting the chaos and joy of building games alone.',                                                       'liampark_dev',  'liam-park-dev'),
('author-5', 'Priya Nair',   'Production Manager at Ubisoft Toronto',  'Agile coach and production veteran across 8 shipped titles. Writes about team health, process, and career growth in games.',                                                       null,            'priya-nair-prod')
on conflict (id) do nothing;

-- ─── PLATFORM STATS (initial) ───────────────────────────────
update platform_stats set
  open_roles = 847,
  studios    = 214,
  members    = 38500,
  articles   = 1290,
  updated_at = now()
where id = 1;
