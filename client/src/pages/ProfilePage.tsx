// client/src/pages/ProfilePage.tsx
// F04. Header trang cá nhân + 2 tab: "Bài viết" (ProfilePosts) và "Bản đồ" (ProfileMap, B14 / N01).
// ProfileMap tải lười bằng React.lazy vì Leaflet khá nặng; chỉ render khi đang ở tab Bản đồ
// để tránh kéo theo CSS + JS của Leaflet khi user chỉ xem Bài viết.

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { usersApi } from '../api/users';
import { parseError } from '../api/client';
import FollowButton from '../components/FollowButton';
import FollowListDialog from '../components/FollowListDialog';
import ImageViewer from '../components/ImageViewer';
import ProfilePosts from '../components/ProfilePosts';
import UserInitial from '../components/UserInitial';
import { useAuth } from '../contexts/AuthContext';
import type { MapPoint, Profile } from '../types';

const ProfileMap = lazy(() => import('../components/ProfileMap'));

type Tab = 'posts' | 'map';

// Đọc tab từ URL ?tab=map (mặc định 'posts'). Refresh / Back giữ nguyên tab đang xem.
function readTab(sp: URLSearchParams): Tab {
  return sp.get('tab') === 'map' ? 'map' : 'posts';
}

export default function ProfilePage() {
  const { username = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = readTab(searchParams);

  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<'followers' | 'following' | null>(null);
  const [viewAvatar, setViewAvatar] = useState(false);

  // State riêng cho bản đồ — chỉ tải khi mở tab để tránh gọi API khi không cần.
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setError(null);
    setList(null);
    setViewAvatar(false);
    // Reset bản đồ khi đổi username.
    setPoints([]);
    setMapError(null);
    setMapLoaded(false);
    usersApi
      .profile(username)
      .then((p) => !cancelled && setProfile(p))
      .catch((err) => !cancelled && setError(parseError(err).message));
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Chỉ gọi API bản đồ khi chuyển sang tab lần đầu.
  useEffect(() => {
    if (tab !== 'map' || !profile || mapLoaded) return;
    let cancelled = false;
    setMapLoading(true);
    setMapError(null);
    usersApi
      .map(profile.username)
      .then((list) => {
        if (cancelled) return;
        setPoints(list);
        setMapLoaded(true);
      })
      .catch((err) => !cancelled && setMapError(parseError(err).message))
      .finally(() => !cancelled && setMapLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, profile, mapLoaded]);

  // Cập nhật URL khi đổi tab (replace để khỏi dồn lịch sử Back).
  const switchTab = (next: Tab) => {
    if (next === tab) return;
    const sp = new URLSearchParams(searchParams);
    if (next === 'posts') sp.delete('tab');
    else sp.set('tab', 'map');
    setSearchParams(sp, { replace: true });
  };

  const isSelf = useMemo(() => user?._id === profile?._id, [user, profile]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!profile) return <div className="page-loading">Đang tải…</div>;

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

      {/* B14: 2 tab — Bài viết / Bản đồ. Render có điều kiện: tránh .profile-posts { display: flex } đè hidden, và chỉ mount ProfileMap khi đang ở tab Bản đồ. */}
      <div className="profile-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'posts'}
          className={`profile-tab ${tab === 'posts' ? 'is-active' : ''}`}
          onClick={() => switchTab('posts')}
        >
          Bài viết
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'map'}
          className={`profile-tab ${tab === 'map' ? 'is-active' : ''}`}
          onClick={() => switchTab('map')}
        >
          Bản đồ
        </button>
      </div>

      {tab === 'posts' && (
        <section className="profile-posts" aria-label="Bài viết">
          <ProfilePosts key={profile.username} username={profile.username} isSelf={isSelf} />
        </section>
      )}

      {tab === 'map' && (
        <section className="profile-map-section" aria-label="Bản đồ">
          <Suspense fallback={<div className="page-loading">Đang tải bản đồ…</div>}>
            <ProfileMap points={points} loading={mapLoading} error={mapError} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
