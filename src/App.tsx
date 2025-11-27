// ... existing code ...
  const [sortOption, setSortOption] = useState<'latest' | 'popular' | 'subreddit' | 'comments'>('latest')
// ... existing code ...
              {/* 정렬 옵션 */}
              <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'subreddit' | 'comments') => setSortOption(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">추천순</SelectItem>
                  <SelectItem value="comments">댓글순</SelectItem>
                  <SelectItem value="subreddit">서브레딧순</SelectItem>
                </SelectContent>
              </Select>
// ... existing code ...