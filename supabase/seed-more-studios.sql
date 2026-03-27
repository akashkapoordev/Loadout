insert into studios (id, name, logo_initials, logo_color, logo_bg, location, description, website, twitter, linkedin, founded, disciplines) values

('epic-games',       'Epic Games',          'EG',  '#0078F2', '#00091A', 'Cary, NC',           'Epic Games is the creator of Fortnite, Unreal Engine, and the Epic Games Store. One of the most influential game and technology companies in the world.',                                               'https://epicgames.com',        'epicgames',       'epic-games',        1991, array['Engineering','Game Design','Art & VFX','Marketing','Audio','Production','Analytics']),

('rockstar-games',   'Rockstar Games',      'RS',  '#FCAF17', '#1A1200', 'New York, NY',        'Rockstar Games is the studio behind Grand Theft Auto and Red Dead Redemption — two of the best-selling and most critically acclaimed franchises in gaming history.',                                   'https://rockstargames.com',    'RockstarGames',   'rockstar-games',    1998, array['Game Design','Engineering','Art & VFX','Writing','Audio','Production']),

('roblox',           'Roblox',              'RBX', '#E2231A', '#1A0000', 'San Mateo, CA',       'Roblox is a global platform where millions of people gather to play, create, and connect. The company builds the engine, economy, and infrastructure powering an immersive 3D experiences platform.',   'https://roblox.com',           'Roblox',          'roblox',            2006, array['Engineering','Game Design','Art & VFX','Marketing','Production','Analytics']),

('turtle-rock',      'Turtle Rock Studios', 'TR',  '#2ECC71', '#001A0B', 'Lake Forest, CA',     'Turtle Rock Studios is the independent developer behind Back 4 Blood and Left 4 Dead. Known for co-operative multiplayer shooters with deep replayability.',                                           'https://turtlerockstudios.com','TurtleRockStudio', null,                2002, array['Game Design','Engineering','Art & VFX','Audio','Production']),

('housemarque',      'Housemarque',         'HQ',  '#E74C3C', '#1A0000', 'Helsinki, Finland',   'Housemarque is a Sony first-party studio behind Returnal and Resogun. One of Europe''s most respected action game developers, now pushing the boundaries of narrative and gameplay.',                  'https://housemarque.com',      'Housemarque',     null,                1995, array['Engineering','Game Design','Art & VFX','Audio']),

('crystal-dynamics', 'Crystal Dynamics',   'CD',  '#8E44AD', '#0D0014', 'Redwood City, CA',    'Crystal Dynamics is the studio behind Tomb Raider, Legacy of Kain, and Marvel''s Avengers. Now working on a new Tomb Raider title and Perfect Dark alongside The Initiative.',                       'https://crystald.com',         'CrystalDynamics', 'crystal-dynamics',  1992, array['Game Design','Engineering','Art & VFX','Writing','Audio','Production'])

on conflict (id) do nothing;
