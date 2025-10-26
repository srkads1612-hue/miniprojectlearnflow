-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type public.user_role as enum ('student', 'instructor', 'admin');
create type public.workshop_status as enum ('upcoming', 'ongoing', 'completed');
create type public.notification_type as enum ('course_update', 'new_lesson', 'achievement', 'workshop_live', 'workshop_update', 'certificate_issued');

-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar text,
  bio text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- User roles table (separate for security)
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role user_role not null,
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Courses table
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  instructor_name text not null,
  category text not null,
  level text not null,
  duration text not null,
  thumbnail text,
  video_url text,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;

create policy "Anyone can view courses"
  on public.courses for select
  to authenticated
  using (true);

create policy "Instructors can insert own courses"
  on public.courses for insert
  to authenticated
  with check (auth.uid() = instructor_id and has_role(auth.uid(), 'instructor'));

create policy "Instructors can update own courses"
  on public.courses for update
  to authenticated
  using (auth.uid() = instructor_id);

-- Lessons table
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text,
  duration text,
  order_index integer not null,
  created_at timestamptz default now()
);

alter table public.lessons enable row level security;

create policy "Anyone can view lessons"
  on public.lessons for select
  to authenticated
  using (true);

-- Workshops table
create table public.workshops (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  instructor_name text not null,
  category text not null,
  thumbnail text,
  max_students integer not null default 30,
  status workshop_status not null default 'upcoming',
  created_at timestamptz default now()
);

alter table public.workshops enable row level security;

create policy "Anyone can view workshops"
  on public.workshops for select
  to authenticated
  using (true);

create policy "Instructors can insert own workshops"
  on public.workshops for insert
  to authenticated
  with check (auth.uid() = instructor_id and has_role(auth.uid(), 'instructor'));

create policy "Instructors can update own workshops"
  on public.workshops for update
  to authenticated
  using (auth.uid() = instructor_id);

create policy "Instructors can delete own workshops"
  on public.workshops for delete
  to authenticated
  using (auth.uid() = instructor_id);

-- Workshop sessions table
create table public.workshop_sessions (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  vimeo_live_url text,
  is_live boolean default false,
  created_at timestamptz default now()
);

alter table public.workshop_sessions enable row level security;

create policy "Anyone can view sessions"
  on public.workshop_sessions for select
  to authenticated
  using (true);

-- Workshop enrollments table
create table public.workshop_enrollments (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(workshop_id, student_id)
);

alter table public.workshop_enrollments enable row level security;

create policy "Users can view enrollments"
  on public.workshop_enrollments for select
  to authenticated
  using (true);

create policy "Students can enroll"
  on public.workshop_enrollments for insert
  to authenticated
  with check (auth.uid() = student_id and has_role(auth.uid(), 'student'));

-- Comments table
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Anyone can view comments"
  on public.comments for select
  to authenticated
  using (true);

create policy "Users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- Certificates table
create table public.certificates (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  workshop_title text not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  instructor_name text not null,
  issued_at timestamptz default now(),
  unique(workshop_id, student_id)
);

alter table public.certificates enable row level security;

create policy "Users can view own certificates"
  on public.certificates for select
  to authenticated
  using (auth.uid() = student_id);

create policy "Instructors can view certificates for their workshops"
  on public.certificates for select
  to authenticated
  using (auth.uid() = instructor_id);

create policy "Instructors can issue certificates"
  on public.certificates for insert
  to authenticated
  with check (auth.uid() = instructor_id and has_role(auth.uid(), 'instructor'));

-- Notifications table
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id text not null,
  item_title text not null,
  item_type text not null,
  type notification_type not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id);

-- Course progress table
create table public.course_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  last_accessed timestamptz default now(),
  total_time_spent integer default 0,
  completion_percentage integer default 0,
  learning_streak integer default 0,
  last_activity_date date,
  achievements jsonb default '[]'::jsonb,
  unique(user_id, course_id)
);

alter table public.course_progress enable row level security;

create policy "Users can view own progress"
  on public.course_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.course_progress for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.course_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Lesson progress table
create table public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  course_progress_id uuid references public.course_progress(id) on delete cascade not null,
  lesson_id uuid not null,
  completed boolean default false,
  time_spent integer default 0,
  video_watch_time integer default 0,
  current_position integer default 0,
  last_watched timestamptz
);

alter table public.lesson_progress enable row level security;

create policy "Users can view own lesson progress"
  on public.lesson_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.course_progress
      where id = lesson_progress.course_progress_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update own lesson progress"
  on public.lesson_progress for update
  to authenticated
  using (
    exists (
      select 1 from public.course_progress
      where id = lesson_progress.course_progress_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert own lesson progress"
  on public.lesson_progress for insert
  to authenticated
  with check (
    exists (
      select 1 from public.course_progress
      where id = lesson_progress.course_progress_id
      and user_id = auth.uid()
    )
  );

-- Trigger to update profiles when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.email
  );
  
  -- Assign default student role
  insert into public.user_roles (user_id, role)
  values (new.id, 'student');
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
