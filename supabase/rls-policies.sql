-- 允许认证用户插入文章
CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 允许认证用户更新文章
CREATE POLICY "Authenticated users can update posts"
  ON posts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 允许认证用户删除文章
CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE
  USING (auth.role() = 'authenticated');
