-- Supabase Auth & Role-Based Access Control Migration
-- LakeClean Mission Control
-- Roles: 'admin', 'operator', 'guest'

-- 1. Ensure profiles table has proper columns and constraints
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT NOT NULL DEFAULT 'Mission Specialist',
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'guest')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Helper security functions for RLS checks
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('operator', 'admin') AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Trigger to automatically provision a profile row when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'operator' -- Strictly default to operator. Ordinary users cannot self-assign admin!
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS Policies for Profiles
-- Any authenticated user can view profiles
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update only their own profile details, but NOT their own role!
CREATE POLICY "Users can update their own display_name"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevents self-promotion
    );

-- Only Administrators can update user roles
CREATE POLICY "Admins can update any profile and role"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. RLS Policies for Waste Reports
-- Everyone can read reports
CREATE POLICY "Public read waste_reports"
    ON public.waste_reports FOR SELECT
    USING (true);

-- Authenticated users and guests can submit waste reports
CREATE POLICY "Authenticated users and guests can insert reports"
    ON public.waste_reports FOR INSERT
    WITH CHECK (true);

-- Only Operators and Admins can update/verify reports
CREATE POLICY "Operators and admins can verify reports"
    ON public.waste_reports FOR UPDATE
    TO authenticated
    USING (public.is_operator_or_admin())
    WITH CHECK (public.is_operator_or_admin());

-- Only Admins can delete reports
CREATE POLICY "Only admins can delete reports"
    ON public.waste_reports FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 6. RLS Policies for Zones
-- Only Admins can modify lake zones
CREATE POLICY "Admins can modify lake zones"
    ON public.zones FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
