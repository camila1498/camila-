import StarIcon from "@/components/ui/StarIcon";
import { teamAreasOrder, teamMembers } from "@/data/team";
import styles from "./TeamByArea.module.css";

export default function TeamByArea() {
  const groups = teamAreasOrder
    .map((area) => ({
      area,
      members: teamMembers.filter((member) => member.area === area),
    }))
    .filter((group) => group.members.length > 0);

  return (
    <section className={styles.section}>
      <div className="wrap">
        {groups.map((group) => (
          <div className={styles.areaBlock} key={group.area}>
            <div className={styles.areaTitle}>
              <span className="star">
                <StarIcon fill="var(--amarillo)" />
              </span>
              {group.area} <span className={styles.count}>{group.members.length}</span>
            </div>
            <div className={styles.grid}>
              {group.members.map((member) => (
                <div className={styles.card} key={member.name}>
                  <h3>{member.name}</h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
