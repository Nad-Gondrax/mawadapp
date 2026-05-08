-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS mahrams CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('homme', 'femme')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  date_naissance DATE,
  sexe TEXT CHECK (sexe IN ('homme', 'femme')) NOT NULL,
  pays TEXT NOT NULL DEFAULT 'France',
  ville TEXT NOT NULL,
  departement TEXT,
  description TEXT NOT NULL DEFAULT '',
  niveau_pratique TEXT CHECK (niveau_pratique IN ('pas pratiquant(e)', 'peu pratiquant(e)', 'pratiquant(e) modéré(e)', 'très pratiquant(e)', 'je demande à Allah de me guider')) DEFAULT 'pas pratiquant(e)',
  style_vestimentaire TEXT[] DEFAULT ARRAY[]::TEXT[],
  profession TEXT CHECK (profession IN ('avec emploi', 'sans emploi', 'étudiant(e)')) DEFAULT 'avec emploi',
  domaine_travail TEXT,
  niveau_etude TEXT CHECK (niveau_etude IN ('bep', 'cap', 'bts', 'licence', 'master', 'doctorat', 'autre')) DEFAULT 'bts',
  details_diplome TEXT,
  enfants BOOLEAN DEFAULT FALSE,
  nombre_enfants INTEGER,
  projet_mariage TEXT CHECK (projet_mariage IN ('immédiat', '6 mois', '1 an', 'ouvert')) DEFAULT 'ouvert',
  preferences_age_min INTEGER DEFAULT 18,
  preferences_age_max INTEGER DEFAULT 65,
  preferences_departements TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferences_niveau_etude TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferences_pratique TEXT CHECK (preferences_pratique IN ('pas pratiquant(e)', 'peu pratiquant(e)', 'pratiquant(e) modéré(e)', 'très pratiquant(e)', 'peu importe')),
  photo_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mahrams
CREATE TABLE IF NOT EXISTS mahrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('père', 'frère', 'oncle', 'tuteur', 'autre')) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  code_validation TEXT,
  code_created_at TIMESTAMP,
  validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

-- Conversations (supervised chats)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_1_id, user_2_id),
  CHECK (user_1_id != user_2_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_mahrams_user_id ON mahrams(user_id);
CREATE INDEX idx_likes_from_user ON likes(from_user_id);
CREATE INDEX idx_likes_to_user ON likes(to_user_id);
CREATE INDEX idx_conversations_user1 ON conversations(user_1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user_2_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
