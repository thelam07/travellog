// client/src/pages/PostFormPage.tsx
// Trang đăng / sửa bài viết. Dùng chung cho /posts/new và /posts/:id/edit.
// BR05: tiêu đề 5–120, nội dung ≤ 5000, ngày không ở tương lai, chi phí ≥ 0, tối đa 6 ảnh JPG/PNG/WebP ≤ 5 MB.

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { fieldErrorsFrom, parseError } from '../api/client';
import { postsApi } from '../api/posts';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { ImageUploader, type OldImage } from '../components/ImageUploader';
import { PageSpinner } from '../components/Spinner';
import { VisibilityPicker } from '../components/VisibilityPicker';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Visibility } from '../types';

type Field = 'title' | 'content' | 'location' | 'tripDate' | 'cost' | 'visibility' | 'images';
type Errors = Partial<Record<Field, string>>;

const TITLE_MIN = 5;
const TITLE_MAX = 120;
const CONTENT_MAX = 5000;
const MAX_IMAGES = 6;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateInput(iso: string): string {
  // Post.tripDate là ISO đầy đủ; input[type=date] cần YYYY-MM-DD
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function PostFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [locationName, setLocationName] = useState('');
  const [tripDate, setTripDate] = useState(todayISO());
  const [cost, setCost] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [files, setFiles] = useState<File[]>([]);
  const [oldImages, setOldImages] = useState<OldImage[]>([]);
  const [errors, setErrors] = useState<Errors>({});

  // Sửa bài: tải bài hiện tại để đổ vào form
  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const post: Post = await postsApi.getPost(id);
        if (cancelled) return;
        setTitle(post.title);
        setContent(post.content);
        setLocationName(post.location?.name ?? '');
        setTripDate(toDateInput(post.tripDate));
        setCost(post.cost ? String(post.cost) : '');
        setVisibility(post.visibility);
        setOldImages(post.images.map((i) => ({ _id: i._id, url: i.url })));
      } catch (err) {
        if (!cancelled) setFormError(parseError(err).message);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  if (isEdit && loadingPost) return <PageSpinner />;

  const set = <K extends Field>(field: K, value: string | Visibility | File[]) => {
    if (field === 'title') setTitle(value as string);
    else if (field === 'content') setContent(value as string);
    else if (field === 'location') setLocationName(value as string);
    else if (field === 'tripDate') setTripDate(value as string);
    else if (field === 'cost') setCost(value as string);
    else if (field === 'visibility') setVisibility(value as Visibility);
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError(null);
  };

  const removeOld = (imgId: string) => {
    setOldImages(oldImages.filter((i) => i._id !== imgId));
  };

  const validate = (): Errors => {
    const errs: Errors = {};
    const t = title.trim();
    if (!t) errs.title = 'Tiêu đề không được trống.';
    else if (t.length < TITLE_MIN || t.length > TITLE_MAX) errs.title = 'Tiêu đề dài 5–120 kí tự.';

    if (!content.trim()) errs.content = 'Nội dung không được trống.';
    else if (content.length > CONTENT_MAX) errs.content = 'Nội dung tối đa 5000 kí tự.';

    if (!locationName.trim()) errs.location = 'Tên địa điểm không được trống.';

    if (!tripDate) errs.tripDate = 'Vui lòng chọn ngày đi.';
    else {
      const d = new Date(tripDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(d.getTime())) errs.tripDate = 'Ngày đi không hợp lệ.';
      else if (d.getTime() > today.getTime() + 14 * 3600 * 1000) {
        // Cho phép lệch múi giờ tối đa 14 giờ (giống server)
        errs.tripDate = 'Ngày đi không được ở tương lai.';
      }
    }

    if (cost.trim()) {
      const n = Number(cost);
      if (Number.isNaN(n)) errs.cost = 'Chi phí phải là số.';
      else if (n < 0) errs.cost = 'Chi phí phải ≥ 0.';
    }

    if (files.length + oldImages.length > MAX_IMAGES) {
      errs.images = `Tối đa ${MAX_IMAGES} ảnh.`;
    }

    return errs;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const location = { name: locationName.trim() };
      let saved: Post;
      if (isEdit && id) {
        saved = await postsApi.updatePost(id, {
          title: title.trim(),
          content: content.trim(),
          location,
          tripDate,
          cost: cost.trim() ? Number(cost) : 0,
          visibility,
          images: files,
          keepImageIds: oldImages.map((i) => i._id),
        });
      } else {
        saved = await postsApi.createPost({
          title: title.trim(),
          content: content.trim(),
          location,
          tripDate,
          cost: cost.trim() ? Number(cost) : 0,
          visibility,
          images: files,
        });
      }
      navigate(`/posts/${saved._id}`, { replace: true });
    } catch (err) {
      const fe = fieldErrorsFrom(err);
      setErrors(fe);
      if (!Object.keys(fe).length) setFormError(parseError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null; // RequireAuth đã chặn, nhưng TS cần

  return (
    <div className="narrow post-form-page">
      <h1>{isEdit ? 'Sửa bài viết' : 'Đăng bài viết mới'}</h1>
      <form onSubmit={submit} className="card stack" noValidate>
        <FormField label="Tiêu đề" required htmlFor="pf-title" error={errors.title}>
          <input
            id="pf-title"
            type="text"
            value={title}
            maxLength={TITLE_MAX}
            aria-invalid={Boolean(errors.title)}
            onChange={(e) => set('title', e.target.value)}
            placeholder="5–120 kí tự"
          />
          {!errors.title && (
            <div className="field-hint">
              {title.trim().length}/{TITLE_MAX}
            </div>
          )}
        </FormField>

        <FormField label="Nội dung" required htmlFor="pf-content" error={errors.content}>
          <textarea
            id="pf-content"
            rows={6}
            value={content}
            maxLength={CONTENT_MAX}
            aria-invalid={Boolean(errors.content)}
            onChange={(e) => set('content', e.target.value)}
            placeholder="Chia sẻ trải nghiệm chuyến đi của bạn…"
          />
          {!errors.content && (
            <div className="field-hint">
              {content.length}/{CONTENT_MAX}
            </div>
          )}
        </FormField>

        <FormField label="Địa điểm" required htmlFor="pf-location" error={errors.location}>
          <input
            id="pf-location"
            type="text"
            value={locationName}
            maxLength={200}
            aria-invalid={Boolean(errors.location)}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Tên địa điểm (vd: Hà Nội, Phú Quốc…)"
          />
        </FormField>

        <div className="form-row">
          <FormField label="Ngày đi" required htmlFor="pf-tripDate" error={errors.tripDate}>
            <input
              id="pf-tripDate"
              type="date"
              value={tripDate}
              max={todayISO()}
              aria-invalid={Boolean(errors.tripDate)}
              onChange={(e) => set('tripDate', e.target.value)}
            />
          </FormField>

          <FormField label="Chi phí (VND)" htmlFor="pf-cost" error={errors.cost}>
            <input
              id="pf-cost"
              type="number"
              min={0}
              step="0.01"
              value={cost}
              aria-invalid={Boolean(errors.cost)}
              onChange={(e) => set('cost', e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <FormField label="Ảnh" required error={errors.images}>
          <ImageUploader
            files={files}
            setFiles={setFiles}
            oldImages={oldImages}
            onRemoveOld={removeOld}
            maxCount={MAX_IMAGES}
          />
        </FormField>

        <FormField label="Chế độ hiển thị" required error={errors.visibility}>
          <VisibilityPicker value={visibility} onChange={(v) => set('visibility', v)} />
        </FormField>

        {formError && <div className="alert alert-error">{formError}</div>}

        <div className="form-actions">
          <Button type="submit" variant="primary" isLoading={submitting} disabled={submitting}>
            {isEdit ? 'Lưu thay đổi' : 'Đăng bài'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>
            Huỷ
          </Button>
        </div>
      </form>
    </div>
  );
}
