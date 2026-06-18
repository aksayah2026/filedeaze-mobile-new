import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TimerOff,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useAttendanceHistory } from "../../hooks/useJobs";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppEmptyState } from "../../components/AppEmptyState";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppInput } from "../../components/AppInput";
import { AppButton } from "../../components/AppButton";
import { AttendanceRecord } from "../../services/job.service";

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "AttendanceHistory">;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const AttendanceHistoryScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [startDate, setStartDate] = useState<string | null>(getTodayStr());
  const [endDate, setEndDate] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(true);

  // Fetch active calendar month
  const { data: activeRecords = [], isLoading: isLoadingActive } = useAttendanceHistory(currentMonth, currentYear);

  // Selected date ranges fetch setup
  const startInfo = useMemo(() => {
    if (!startDate) return { month: currentMonth, year: currentYear };
    const parts = startDate.split("-");
    return { month: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
  }, [startDate, currentMonth, currentYear]);

  const endInfo = useMemo(() => {
    if (!endDate) return { month: currentMonth, year: currentYear };
    const parts = endDate.split("-");
    return { month: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
  }, [endDate, currentMonth, currentYear]);

  const { data: startRecords = [], isLoading: isLoadingStart } = useAttendanceHistory(startInfo.month, startInfo.year);
  const { data: endRecords = [], isLoading: isLoadingEnd } = useAttendanceHistory(endInfo.month, endInfo.year);

  const isLoading = isLoadingActive || isLoadingStart || isLoadingEnd;

  // Merge all fetched records
  const allRecords = useMemo(() => {
    const combined = [...activeRecords, ...startRecords, ...endRecords];
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [activeRecords, startRecords, endRecords]);

  // Filter local records by selection range
  const filteredRecords = useMemo(() => {
    if (!startDate) return [];
    if (!endDate) {
      return allRecords.filter((r) => r.date === startDate);
    } else {
      return allRecords
        .filter((r) => r.date >= startDate && r.date <= endDate)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  }, [allRecords, startDate, endDate]);

  // Summary stats
  const stats = useMemo(() => {
    const present = filteredRecords.filter((r) => r.status === "PRESENT").length;
    const late = filteredRecords.filter((r) => r.status === "LATE").length;
    const halfDay = filteredRecords.filter((r) => r.status === "HALF_DAY").length;
    const absent = filteredRecords.filter((r) => r.status === "ABSENT").length;
    return { present, late, halfDay, absent, total: filteredRecords.length };
  }, [filteredRecords]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayIndex = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentMonth, currentYear]);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, key: `empty-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, dateStr, key: dateStr });
    }
    return cells;
  }, [currentMonth, currentYear, daysInMonth, firstDayIndex]);

  const handleDayPress = (dateStr: string) => {
    const todayStr = getTodayStr();
    if (dateStr > todayStr) {
      return;
    }
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
      // Do not hide calendar yet, let user select end date
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(null);
      } else if (dateStr === startDate) {
        setStartDate(null);
        setEndDate(null);
      } else {
        setEndDate(dateStr);
        setCalendarVisible(false); // Hide calendar when range selection is complete
      }
    }
  };

  const getSelectedRangeText = () => {
    if (!startDate) return "Select a date range on the calendar";
    const formatPart = (dateStr: string) => {
      const parts = dateStr.split("-");
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${MONTHS[mIdx].slice(0, 3)} ${d}, ${y}`;
    };
    if (!endDate) {
      return formatPart(startDate);
    }
    return `${formatPart(startDate)} - ${formatPart(endDate)}`;
  };

  const getStatusVariant = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "PRESENT": return "success";
      case "LATE":    return "warning";
      case "HALF_DAY": return "primary";
      case "ABSENT": return "danger";
      default:        return "secondary";
    }
  };

  const getStatusIcon = (status: AttendanceRecord["status"]) => {
    const size = 16;
    switch (status) {
      case "PRESENT":
        return <CheckCircle2 size={size} color={theme.colors.success} />;
      case "LATE":
        return <Clock size={size} color={theme.colors.warning} />;
      case "HALF_DAY":
        return <TimerOff size={size} color={theme.colors.primary} />;
      case "ABSENT":
        return <XCircle size={size} color={theme.colors.danger} />;
      default:
        return <AlertCircle size={size} color={theme.colors.textMuted} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    const year = parts[0] ? parseInt(parts[0], 10) : 2026;
    const monthIndex = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
    const dayVal = parts[2] ? parseInt(parts[2], 10) : 12;

    const d = new Date(year, monthIndex, dayVal);
    const day = dayVal.toString().padStart(2, "0");
    const month = MONTHS[monthIndex].slice(0, 3);
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return { day, month, weekday };
  };

  const renderRecord = ({ item }: { item: AttendanceRecord }) => {
    const { day, month, weekday } = formatDate(item.date);
    const isAbsent = item.status === "ABSENT";

    return (
      <AppCard style={styles.recordCard} elevation={false} border>
        <View style={styles.recordRow}>
          <View
            style={[
              styles.dateBlock,
              {
                backgroundColor: isAbsent
                  ? `${theme.colors.danger}10`
                  : `${theme.colors.primary}10`,
              },
            ]}
          >
            <Text
              style={[
                styles.dateDay,
                {
                  color: isAbsent ? theme.colors.danger : theme.colors.primary,
                },
              ]}
            >
              {day}
            </Text>
            <Text
              style={[
                styles.dateMonth,
                {
                  color: isAbsent ? theme.colors.danger : theme.colors.primary,
                },
              ]}
            >
              {month}
            </Text>
            <Text style={[styles.dateWeekday, { color: theme.colors.textMuted }]}>
              {weekday}
            </Text>
          </View>

          <View style={styles.recordContent}>
            <View style={styles.recordTopRow}>
              <View style={styles.statusIconRow}>
                {getStatusIcon(item.status)}
                <AppBadge label={item.status.replace("_", " ")} variant={getStatusVariant(item.status)} style={{ marginLeft: 6 }} />
              </View>
            </View>

            {isAbsent ? (
              <Text style={[styles.absentText, { color: theme.colors.textMuted }]}>
                No check-in recorded for this day
              </Text>
            ) : (
              <>
                <View style={styles.timingRow}>
                  <View style={styles.timeChip}>
                    <Clock size={12} color={theme.colors.success} />
                    <Text style={[styles.timeChipText, { color: theme.colors.text }]}>
                      In: <Text style={{ fontWeight: "700" }}>{item.checkInTime}</Text>
                    </Text>
                  </View>
                  <View style={[styles.timeDivider, { backgroundColor: theme.colors.borderLight }]} />
                  <View style={styles.timeChip}>
                    <Clock size={12} color={theme.colors.danger} />
                    <Text style={[styles.timeChipText, { color: theme.colors.text }]}>
                      Out: <Text style={{ fontWeight: "700" }}>{item.checkOutTime ?? "--"}</Text>
                    </Text>
                  </View>
                </View>

                {item.workingHours && (
                  <View style={styles.hoursRow}>
                    <Clock size={12} color={theme.colors.textMuted} />
                    <Text style={[styles.hoursText, { color: theme.colors.textMuted }]}>
                      {item.workingHours} worked
                    </Text>
                    {item.location && (
                      <>
                        <View style={[styles.dot, { backgroundColor: theme.colors.borderLight }]} />
                        <MapPin size={12} color={theme.colors.textMuted} />
                        <Text style={[styles.hoursText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </AppCard>
    );
  };

  const ListHeader = () => (
    <>
      <View style={styles.statsRow}>
        <View style={[styles.statChip, { backgroundColor: `${theme.colors.success}15` }]}>
          <Text style={[styles.statNum, { color: theme.colors.success }]}>{stats.present}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.success }]}>Present</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: `${theme.colors.warning}15` }]}>
          <Text style={[styles.statNum, { color: theme.colors.warning }]}>{stats.late}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.warning }]}>Late</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: `${theme.colors.primary}15` }]}>
          <Text style={[styles.statNum, { color: theme.colors.primary }]}>{stats.halfDay}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.primary }]}>Half Day</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: `${theme.colors.danger}15` }]}>
          <Text style={[styles.statNum, { color: theme.colors.danger }]}>{stats.absent}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.danger }]}>Absent</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
        {getSelectedRangeText()} ({filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""} found)
      </Text>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Attendance History"
        subtitle="Your attendance log"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {/* Selected Range Toggle Bar */}
      <Pressable
        onPress={() => setCalendarVisible(!calendarVisible)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.toggleBar,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.borderLight },
          pressed && { opacity: 0.8 }
        ]}
      >
        <View style={styles.toggleBarLeft}>
          <Calendar size={18} color={theme.colors.primary} />
          <Text style={[styles.toggleBarText, { color: theme.colors.text }]}>
            {getSelectedRangeText()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation(); // Prevent toggling the calendar visibility
              const todayStr = getTodayStr();
              const todayParts = todayStr.split("-");
              setCurrentMonth(parseInt(todayParts[1], 10));
              setCurrentYear(parseInt(todayParts[0], 10));
              setStartDate(todayStr);
              setEndDate(null);
              setCalendarVisible(false);
            }}
            style={({ pressed }: { pressed: boolean }) => [
              styles.todayBtn,
              { backgroundColor: `${theme.colors.primary}12`, opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <Text style={[styles.todayBtnText, { color: theme.colors.primary }]}>Today</Text>
          </Pressable>
          <ChevronDown
            size={18}
            color={theme.colors.textMuted}
            style={{ transform: [{ rotate: calendarVisible ? "180deg" : "0deg" }] }}
          />
        </View>
      </Pressable>

      {/* Calendar Component */}
      {calendarVisible && (
        <View style={[styles.calendarContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.borderLight }]}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.navBtn}>
              <ChevronLeft size={20} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>
              {MONTHS[currentMonth - 1]} {currentYear}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.navBtn}>
              <ChevronRight size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekDaysRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={[styles.weekDayText, { color: theme.colors.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarCells.map((cell) => {
              if (!cell.day) {
                return <View key={cell.key} style={styles.dayCell} />;
              }

              const { day, dateStr } = cell;
              const isStart = dateStr === startDate;
              const isEnd = dateStr === endDate;
              const isInRange = !!(startDate && endDate && dateStr && dateStr > startDate && dateStr < endDate);
              const isSelected = isStart || isEnd || isInRange;
              const isToday = dateStr === getTodayStr();
              const isFuture = dateStr ? dateStr > getTodayStr() : false;

              const record = allRecords.find((r) => r.date === dateStr);

              return (
                <Pressable
                  key={cell.key}
                  onPress={() => !isFuture && handleDayPress(dateStr!)}
                  disabled={isFuture}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.dayCell,
                    isStart && { backgroundColor: theme.colors.primary, borderRadius: 20 },
                    isEnd && { backgroundColor: theme.colors.primary, borderRadius: 20 },
                    isInRange && { backgroundColor: `${theme.colors.primary}15` },
                    isToday && !isStart && !isEnd && { borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 20 },
                    isFuture && { opacity: 0.3 },
                    pressed && !isFuture && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isStart || isEnd
                          ? "#ffffff"
                          : isSelected
                          ? theme.colors.primary
                          : isFuture
                          ? theme.colors.textLight
                          : theme.colors.text,
                        fontWeight: (isSelected || isToday) && !isFuture ? "700" : "400",
                      },
                    ]}
                  >
                    {day}
                  </Text>
                  
                  {record && (
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            record.status === "PRESENT"
                              ? theme.colors.success
                              : record.status === "LATE"
                              ? theme.colors.warning
                              : record.status === "HALF_DAY"
                              ? theme.colors.primary
                              : theme.colors.danger,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {isLoading ? (
        <AppLoader message="Loading attendance records..." />
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <AppEmptyState
              title="No Records Found"
              description="No attendance data for the selected date or range."
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setCalendarVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendarContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  navBtn: {
    padding: 8,
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekDayText: {
    width: "14%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayText: {
    fontSize: 14,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: "absolute",
    bottom: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  statNum: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  recordCard: {
    marginBottom: 10,
    padding: 12,
  },
  recordRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateBlock: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dateWeekday: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  recordContent: {
    flex: 1,
    justifyContent: "center",
  },
  recordTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statusIconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  absentText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeChipText: {
    fontSize: 12,
  },
  timeDivider: {
    width: 1,
    height: 14,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "nowrap",
  },
  hoursText: {
    fontSize: 11,
    flexShrink: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    marginHorizontal: 2,
  },
  toggleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleBarText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
