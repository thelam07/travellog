import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { usersApi } from '../api/users';
import { parseError } from '../api/client';
import FollowButton from '../components/FollowButton';
import FollowListDialog from '../components/FollowListDialog';
import ImageViewer from '../components/ImageViewer';
import ProfilePosts from '../components/ProfilePosts';
import UserInitial from '../components/UserInitial';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';

// F04. Header trang cá nhân + danh sách bài (GET /posts?author=, B10) bên dưới.
export default function ProfilePage() {
  const { username = '' } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<'followers' | 'following' | null>(null);
  const [viewAvatar, setViewAvatar] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setError(null);
    setList(null);
    setViewAvatar(false);
    usersApi
      .profile(username)
      .then((p) => !cancelled && setProfile(p))
      .catch((err) => !cancelled && setError(parseError(err).message));
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!profile) return <div className="page-loading">Đang tải…</div>;

  const isSelf = user?._id === profile._id;
  // Theo dõi / bỏ theo dõi xong thì cập nhật số người theo dõi ngay, không cần tải lại trang
  const onFollowChange = (following: boolean) =>
    setProfile((p) => p && { ...p, isFollowing: following, followerCount: p.followerCount + (following ? 1 : -1) });

  return (
    <div className="profile-page stack">
      <section className="profile-header card">
        {/* (Mở rộng – A) Có ảnh đại diện thì bấm để xem toàn màn hình */}
        {profile.avatar ? (
          <button
            type="button"
            className="avatar-btn"
            onClick={() => setViewAvatar(true)}
            aria-label={`Xem ảnh đại diện của ${profile.displayName || profile.username}`}
          >
            <UserInitial user={profile} size={88} />
          </button>
        ) : (
          <UserInitial user={profile} size={88} />
        )}
        <div className="profile-info">
          <h1>
            {profile.displayName || profile.username}
            {profile.role === 'admin' && <span className="badge">Quản trị viên</span>}
            {profile.isLocked && <span className="badge badge-danger">Đã khoá</span>}
          </h1>
          <div className="muted">@{profile.username}</div>
          {profile.bio && <p>{profile.bio}</p>}
          <div className="profile-counts">
            <span>
              <strong>{profile.postCount}</strong> bài viết
            </span>
            <button type="button" className="link-btn" onClick={() => setList('followers')}>
              <strong>{profile.followerCount}</strong> người theo dõi
            </button>
            <button type="button" className="link-btn" onClick={() => setList('following')}>
              <strong>{profile.followingCount}</strong> đang theo dõi
            </button>
          </div>
          {isSelf && (
            <Link to="/settings/profile" className="btn btn-secondary">
              Sửa hồ sơ
            </Link>
          )}
          {!isSelf && profile.role !== 'admin' && (
            <FollowButton
              key={`${profile._id}-${profile.isFollowing}`}
              userId={profile._id}
              isFollowing={profile.isFollowing}
              onChange={onFollowChange}
            />
          )}
        </div>
      </section>
      {viewAvatar && profile.avatar && (
        <ImageViewer
          images={[{ url: profile.avatar.url, alt: `Ảnh đại diện của ${profile.displayName || profile.username}` }]}
          onClose={() => setViewAvatar(false)}
        />
      )}
      {list && <FollowListDialog username={profile.username} kind={list} onClose={() => setList(null)} />}
      <section className="profile-posts" aria-label="Bài viết">
        <h2 className="profile-posts-title">Bài viết</h2>
        <ProfilePosts key={profile.username} username={profile.username} isSelf={isSelf} />
      </section>
    </div>
  );
}
