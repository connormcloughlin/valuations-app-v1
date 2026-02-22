# 🔧 **Backend API Proxy Requirements**

## **📋 Endpoint Specification**

**Endpoint**: `GET /media/{mediaID}/image`

**Purpose**: Fetch images from private Azure Blob Storage and serve them to the mobile app as base64 data URLs.

## **🔧 Implementation Requirements**

### **1. Input Parameters**
- **Path Parameter**: `mediaID` (integer) - The media file ID from the database
- **Authentication**: Use existing API authentication (JWT token in header)

### **2. Backend Process**
```csharp
[HttpGet("{mediaID}/image")]
public async Task<IActionResult> GetImage(int mediaID)
{
    try
    {
        // 1. Get media file from database
        var mediaFile = await _context.MediaFiles
            .FirstOrDefaultAsync(m => m.MediaID == mediaID);
            
        if (mediaFile == null)
        {
            return NotFound($"Media file with ID {mediaID} not found");
        }

        // 2. Extract blob path from BlobURL
        // Example: "https://valuationsupload.blob.core.windows.net/valuations-media/riskAssessmentItem/15867258/20251018T104530528Z_y0qvh5jh.jpeg"
        var blobUrl = mediaFile.BlobURL;
        var uri = new Uri(blobUrl);
        var containerName = uri.Segments[1].TrimEnd('/'); // "valuations-media"
        var blobName = string.Join("", uri.Segments.Skip(2)); // "riskAssessmentItem/15867258/..."

        // 3. Create Azure Blob Storage client
        var connectionString = _configuration.GetConnectionString("AzureStorage");
        var blobClient = new BlobClient(connectionString, containerName, blobName);

        // 4. Download blob content
        var downloadStream = await blobClient.OpenReadAsync();
        var bytes = new byte[downloadStream.Length];
        await downloadStream.ReadAsync(bytes, 0, bytes.Length);

        // 5. Convert to base64
        var base64 = Convert.ToBase64String(bytes);
        
        // 6. Determine content type from file extension
        var contentType = GetContentType(mediaFile.FileName);
        
        // 7. Return as data URL
        var dataUrl = $"data:{contentType};base64,{base64}";
        
        return Ok(new { imageUrl = dataUrl });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching image for media ID {MediaID}", mediaID);
        return StatusCode(500, "Error fetching image from storage");
    }
}

private string GetContentType(string fileName)
{
    var extension = Path.GetExtension(fileName).ToLowerInvariant();
    return extension switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        _ => "image/jpeg" // default
    };
}
```

### **3. Database Schema Requirements**
The endpoint expects a `MediaFiles` table with these columns:
- `MediaID` (int, primary key)
- `BlobURL` (string) - Full Azure Blob Storage URL
- `FileName` (string) - Original file name for content type detection

### **4. Azure Storage Configuration**
- **Connection String**: Store in `appsettings.json` as `AzureStorage` connection string
- **Permissions**: Backend service needs read access to both storage accounts:
  - `valuationsupload.blob.core.windows.net`
  - `valuationstest.blob.core.windows.net`

### **5. Response Format**

Required:
- Content-Type: `application/json; charset=utf-8`
- Body MUST include property: `imageUrl`

Preferred shape (client-ready data URL):
```json
{
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "mediaId": 153,
  "mimeType": "image/jpeg",
  "etag": "W/\"abc123\"",
  "updatedAt": "2025-10-18T11:40:00Z"
}
```

Accepted variant (raw base64 string; client will prefix `data:<mime>;base64,`):
```json
{
  "imageUrl": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "mimeType": "image/jpeg"
}
```

Not accepted:
- Raw binary/Blob/stream responses
- HTML error pages
- JSON without the `imageUrl` property
- Different property name (e.g., `data`, `image`, `content`)

Recommended headers:
- `Content-Type: application/json; charset=utf-8`
- Optional caching: `ETag`, `Cache-Control: private, max-age=300`

Error responses (examples):
```json
{ "message": "Not found" }
```
Use appropriate status codes: `404` (not found), `403` (forbidden), `500` (server error).

Notes:
- `mimeType` should be the real type (e.g., `image/png`, `image/jpeg`). If missing, client defaults to `image/jpeg`.
- Base64 adds ~33% payload overhead; consider thumbnails or future query params for size control.
- The client treats responses without `imageUrl` as an error.

## **🔒 Security Considerations**

1. **Authentication**: Use existing JWT token validation
2. **Authorization**: Verify user has access to the media file
3. **Rate Limiting**: Consider implementing rate limiting for image requests
4. **Caching**: Consider server-side caching for frequently accessed images

## **📊 Performance Considerations**

1. **Streaming**: For large images, consider streaming the response
2. **Compression**: Consider image compression before base64 encoding
3. **Caching**: Implement server-side caching with appropriate TTL
4. **CDN**: Consider using Azure CDN for better performance

## **🧪 Testing Requirements**

### **Test Cases**
1. **Valid Media ID**: Should return base64 image data
2. **Invalid Media ID**: Should return 404 Not Found
3. **Missing Blob**: Should return 404 if blob doesn't exist in storage
4. **Authentication**: Should require valid JWT token
5. **Different File Types**: Test with .jpg, .png, .gif files

### **Test Data**
Use the media files from the payload:
- Media ID 1: `https://valuationstest.blob.core.windows.net/valuations-media-test/riskAssessmentItem/15867258/20251018T103652181Z_efkhpqhb.jpeg`
- Media ID 2: `https://valuationstest.blob.core.windows.net/valuations-media-test/riskAssessmentItem/15867258/20251018T103652892Z_suzervmw.jpeg`
- Media ID 3: `https://valuationstest.blob.core.windows.net/valuations-media-test/riskAssessmentItem/15867258/20251018T103653966Z_hrvyjx2g.jpeg`
- Media ID 4: `https://valuationsupload.blob.core.windows.net/valuations-media/riskAssessmentItem/15867258/20251018T104530528Z_y0qvh5jh.jpeg`
- Media ID 5: `https://valuationsupload.blob.core.windows.net/valuations-media/riskAssessmentItem/15867258/20251018T104536318Z_33ihhefl.jpeg`

## **🚀 Deployment Checklist**

- [ ] Add Azure Storage connection string to configuration
- [ ] Install Azure.Storage.Blobs NuGet package
- [ ] Add endpoint to API controller
- [ ] Test with sample media files
- [ ] Verify authentication works
- [ ] Test error handling scenarios
- [ ] Deploy to staging environment
- [ ] Test with mobile app

## **📱 Mobile App Integration**

Once implemented, the mobile app will:
1. Call `GET /media/{mediaID}/image`
2. Receive base64 data URL
3. Display image in React Native Image component
4. Cache the result locally for 24 hours

The endpoint should be ready for testing within 1-2 hours of development time! 🎯

## **🔍 Current Issue**

The mobile app is currently logging:
```
Unexpected image payload format: undefined
```

Cause: The endpoint is returning a shape other than JSON with an `imageUrl` property (or a raw base64 string). Once the endpoint returns one of the accepted shapes documented in section 5, the client will display images correctly.

## **📋 Implementation Priority**

**HIGH PRIORITY** - This endpoint is required for the mobile app to display images from private Azure Storage accounts. Without this endpoint, users cannot view photos in the survey items.

**Estimated Development Time**: 1-2 hours
**Testing Time**: 30 minutes
**Total Time to Production**: 2-3 hours
