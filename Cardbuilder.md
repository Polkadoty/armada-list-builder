# Star Wars Armada Custom Content Implementation Plan

## Database Schema

### Custom Content Tables

```sql
-- Custom squadrons table
CREATE TABLE custom_squadrons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Basic info
    name TEXT NOT NULL,
    type TEXT DEFAULT 'squadron',
    faction TEXT NOT NULL,
    squadron_type TEXT,
    author TEXT[],
    alias TEXT,
    team TEXT,
    release TEXT,
    expansion TEXT,
    ace_name TEXT,
    unique_class TEXT[],
    nicknames TEXT[],
    
    -- Stats
    irregular BOOLEAN DEFAULT false,
    hull INTEGER,
    speed INTEGER,
    points INTEGER,
    unique BOOLEAN DEFAULT false,
    ace BOOLEAN DEFAULT false,
    
    -- Complex data structures as JSONB
    tokens JSONB,
    armament JSONB,
    abilities JSONB,
    
    -- Text fields
    ability TEXT,
    
    -- Image handling
    silhouette_path TEXT,
    artwork_path TEXT,
    cardimage_path TEXT,
    
    -- New columns
    downloads_count INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    import_alias TEXT UNIQUE
);

-- Image storage records
CREATE TABLE custom_squadron_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    squadron_id UUID REFERENCES custom_squadrons(id) ON DELETE CASCADE,
    image_type TEXT CHECK (image_type IN ('silhouette', 'artwork', 'cardimage')),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sharing and interaction table
CREATE TABLE shared_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT CHECK (content_type IN ('squadron', 'ship', 'upgrade')),
    shared_by UUID REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloads_count INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0
);

-- User interactions table
CREATE TABLE user_content_interactions (
    user_id UUID REFERENCES auth.users(id),
    shared_content_id UUID REFERENCES shared_content(id) ON DELETE CASCADE,
    interaction_type TEXT CHECK (interaction_type IN ('download', 'favorite', 'rating')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, shared_content_id, interaction_type)
);

-- Performance indexes
CREATE INDEX idx_shared_content_type ON shared_content(content_type);
CREATE INDEX idx_shared_content_status ON shared_content(status);
CREATE INDEX idx_user_interactions_type ON user_content_interactions(interaction_type);

-- User downloads table
CREATE TABLE user_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('squadron', 'ship', 'upgrade')),
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER NOT NULL,
  local_modifications JSONB,
  UNIQUE(user_id, content_id)
);
```

### Similar Tables Needed for Ships and Upgrades

Create similar tables for ships and upgrades, following their respective JSON templates but maintaining the same basic structure:
- `custom_ships`
- `custom_ship_images`
- `custom_upgrades`
- `custom_upgrade_images`

## Storage Setup

### Supabase Storage Configuration

1. Create storage bucket:
```typescript
const { data: bucket } = await supabase
  .storage
  .createBucket('custom-content', {
    public: false,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  });
```

2. Storage folder structure:
```
custom-content/
├── squadrons/
│   └── {squadron_id}/
│       ├── silhouette.{ext}
│       ├── artwork.{ext}
│       └── cardimage.{ext}
├── ships/
│   └── {ship_id}/
│       ├── silhouette.{ext}
│       ├── artwork.{ext}
│       └── cardimage.{ext}
└── upgrades/
    └── {upgrade_id}/
        ├── artwork.{ext}
        └── cardimage.{ext}
```

## Core Functions

### Image Management

```typescript
// Upload image to storage
async function uploadContentImage(
  contentType: 'squadron' | 'ship' | 'upgrade',
  contentId: string, 
  imageType: 'silhouette' | 'artwork' | 'cardimage',
  file: File
) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${contentType}s/${contentId}/${imageType}.${fileExt}`;
  
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('custom-content')
    .upload(filePath, file);
    
  if (storageError) throw storageError;
  
  // Record in appropriate images table
  const { data: imageRecord, error: dbError } = await supabase
    .from(`custom_${contentType}_images`)
    .insert({
      [`${contentType}_id`]: contentId,
      image_type: imageType,
      storage_path: filePath
    });
    
  if (dbError) throw dbError;
  
  return storageData;
}

// Get signed URLs for content images
async function getContentImages(
  contentType: 'squadron' | 'ship' | 'upgrade',
  contentId: string
) {
  const { data: images } = await supabase
    .from(`custom_${contentType}_images`)
    .select('*')
    .eq(`${contentType}_id`, contentId);
    
  return Promise.all(
    images.map(async (img) => {
      const { data: url } = await supabase
        .storage
        .from('custom-content')
        .createSignedUrl(img.storage_path, 3600);
        
      return {
        type: img.image_type,
        url: url.signedUrl
      };
    })
  );
}
```

### Content Management

```typescript
// Save new custom content
async function saveCustomContent(
  contentType: 'squadron' | 'ship' | 'upgrade',
  contentData: any,
  images: {
    silhouette?: File,
    artwork?: File,
    cardimage?: File
  }
) {
  // Save content data
  const { data: content, error: contentError } = await supabase
    .from(`custom_${contentType}s`)
    .insert({
      ...contentData,
      created_by: supabase.auth.user()?.id
    })
    .single();
    
  if (contentError) throw contentError;
  
  // Upload images
  const imagePromises = Object.entries(images).map(([type, file]) => {
    if (file) {
      return uploadContentImage(contentType, content.id, type as any, file);
    }
  });
  
  await Promise.all(imagePromises);
  
  // Create sharing record
  const { data: shared, error: shareError } = await supabase
    .from('shared_content')
    .insert({
      content_id: content.id,
      content_type: contentType,
      shared_by: supabase.auth.user()?.id
    });
    
  if (shareError) throw shareError;
  
  return content;
}

// Get shared content with images
async function getSharedContent(
  contentType: 'squadron' | 'ship' | 'upgrade',
  sharedContentId: string
) {
  const { data: shared } = await supabase
    .from('shared_content')
    .select(`*, custom_${contentType}s(*)`)
    .eq('id', sharedContentId)
    .single();
    
  const images = await getContentImages(contentType, shared.content_id);
  
  return {
    ...shared[`custom_${contentType}s`],
    images
  };
}
```

### User Interactions

```typescript
// Record user interaction
async function recordInteraction(
  userId: string,
  sharedContentId: string,
  interactionType: 'download' | 'favorite' | 'rating',
  rating?: number
) {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .upsert({
      user_id: userId,
      shared_content_id: sharedContentId,
      interaction_type: interactionType,
      rating
    });
    
  if (error) throw error;
  
  // Update counts/ratings in shared_content table
  if (interactionType === 'download') {
    await supabase.rpc('increment_downloads', { content_id: sharedContentId });
  } else if (interactionType === 'rating') {
    await supabase.rpc('update_average_rating', { 
      content_id: sharedContentId,
      new_rating: rating 
    });
  }
  
  return data;
}

// Get user's downloaded content
async function getUserDownloads(userId: string) {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .select(`
      shared_content_id,
      shared_content (
        content_type,
        content_id,
        custom_squadrons(*),
        custom_ships(*),
        custom_upgrades(*)
      )
    `)
    .eq('user_id', userId)
    .eq('interaction_type', 'download');
    
  if (error) throw error;
  return data;
}
```

## Implementation Steps

1. **Database Setup**
   - Create all necessary tables in Supabase
   - Set up indexes
   - Create storage bucket
   - Set up appropriate RLS policies

2. **Backend Functions**
   - Implement core image management functions
   - Implement content management functions
   - Set up user interaction tracking
   - Create necessary RPC functions for counts/ratings

3. **Frontend Components**
   - Create card builder interface
   - Implement image upload/preview
   - Build content browsing interface
   - Add download/favorite/rating functionality

4. **Local Storage**
   - Set up IndexedDB for downloaded content
   - Implement image caching
   - Handle offline access to downloaded content

5. **Testing**
   - Test image upload/download
   - Verify content sharing
   - Check user interaction tracking
   - Validate offline functionality

6. **Optimization**
   - Implement image compression
   - Add caching strategies
   - Optimize database queries
   - Add error handling and recovery

## Security Considerations

1. **RLS Policies**
```sql
-- Example RLS policies
ALTER TABLE custom_squadrons ENABLE ROW LEVEL SECURITY;

-- Users can read any published content
CREATE POLICY "Read published content"
  ON custom_squadrons
  FOR SELECT
  USING (true);

-- Users can only modify their own content
CREATE POLICY "Modify own content"
  ON custom_squadrons
  FOR ALL
  USING (auth.uid() = created_by);
```

2. **Storage Security**
- Set up appropriate CORS policies
- Use signed URLs for image access
- Implement file type validation
- Set up size limits for uploads

3. **User Authentication**
- Require authentication for content creation
- Validate user permissions
- Track content ownership
- Handle user deletion

## Monitoring and Maintenance

1. **Analytics**
- Track popular content
- Monitor storage usage
- Track user engagement
- Record error rates

2. **Backup Strategy**
- Regular database backups
- Storage bucket backups
- User data export functionality

3. **Content Moderation**
- Implement reporting system
- Set up content review process
- Handle takedown requests
- Manage blocked users

## Future Enhancements

1. **Content Features**
- Version control for content
- Content collections/playlists
- Collaborative editing
- Content templates

2. **Social Features**
- User profiles
- Content comments
- Follow creators
- Share content

3. **Integration**
- API access
- Export to other formats
- Import from other sources
- Mobile app support