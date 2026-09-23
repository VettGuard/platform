package usecase

import "time"

func pgUnixTime(epoch int64) time.Time { return time.Unix(epoch, 0).UTC() }
