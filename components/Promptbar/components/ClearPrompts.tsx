import {IconCheck, IconTrash, IconX} from "@tabler/icons-react"
import {FC, useState} from "react"

import {useTranslation} from "next-i18next"

import {SidebarButton} from "@/components/Sidebar/SidebarButton"


interface Props {
  onClearPrompts: () => void
}

export const ClearPrompts: FC<Props> = ({onClearPrompts}) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false)

  const {t} = useTranslation("sidebar")

  const handleClearPrompts = () => {
    onClearPrompts()
    setIsConfirming(false)
  }

  return isConfirming ? (
    <div className="flex w-full cursor-pointer items-center rounded-lg py-3 px-3 hover:bg-gray-500/10">
      <IconTrash size={18} />

      <div className="ml-3 flex-1 text-left text-[12.5px] leading-3 text-white">
        {t("Are you sure?")}
      </div>

      <div className="flex w-[40px]">
        <IconCheck
          className="ml-auto mr-1 min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            handleClearPrompts()
          }}
        />

        <IconX
          className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            setIsConfirming(false)
          }}
        />
      </div>
    </div>
  ) : (
    <SidebarButton
      text={t("Clear prompts")}
      icon={<IconTrash size={18} />}
      onClick={() => setIsConfirming(true)}
    />
  )
}