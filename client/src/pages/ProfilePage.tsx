import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { usersApi } from '../api/users';
import { parseError } from '../api/client';
import FollowButton from '../components/FollowButton';
import FollowListDialog from '../components/FollowListDialog';
import UserInitial from '../components/UserInitial';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';

// F04. Phần danh sách bài (B) gắn vào dưới header khi có PostList.
export default function ProfilePage() {
  const { username = '' } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setError(null);
    setList(null);
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
    <>
      <section className="profile-header card">
        <UserInitial user={profile} size={88} />
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
      {list && <FollowListDialog username={profile.username} kind={list} onClose={() => setList(null)} />}
    </>
  );
}
