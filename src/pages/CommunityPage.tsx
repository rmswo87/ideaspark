// ... existing code ...
                              <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => navigate(`/profile/${post.user_id}`)}>
                                  <UserIcon className="h-4 w-4 mr-2" />
                                  프로필 보기
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
// ... existing code ...